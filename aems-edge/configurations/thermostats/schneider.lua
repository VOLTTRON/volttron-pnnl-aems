-- SE8650 Pacific Northwest National Laboratory -- Heartbeat and custom standby mode
if not init then
    -- Constants
    local IMPERIAL_UNITS = 2
    local RTU_TYPE = 1 -- 1=RTU; 2=HP
    local COOLING_DURING_ECON = 2 -- 1=No mechanical cooling when economizing; 2=Mechanical cooling allowed when economizing
    local HAS_ECONOMIZER = 1 -- 1=OFF; 2=ON
    local FAN_MODE = 3 -- 1=ON; 2=Load; 3=Occupancy
    local PIR_TIMER_DEFAULT = 10 -- in minutes
    local SPT_PRIORITY_DEFAULT = 16 -- Default setpoint override priority
    local DEFAULT_COMM_FAIL_TIME = 300 -- seconds
    hasPIR = true
    -- Initial system settings
    ME.BV7 = 1
    ME.MV6 = IMPERIAL_UNITS
    ME.MV58_PV[4] = 1 -- Detach setpoint
    ME.MV72 = HAS_ECONOMIZER
    ME.MV79 = COOLING_DURING_ECON
    ME.MV119 = RTU_TYPE
    ME.MV17 = FAN_MODE

    -- Communication fail settings
    ME.AV28_Desc = "CommFailTmr"
    ME.AV28_Min = 90
    ME.AV28_Max = 900

    -- Network heartbeat and demand response (DR) flag
    ME.AV30_Desc = "Netwk HeartBt"
    ME.AV29_Desc = "DR Flag"
    ME.AV30, ME.AV29 = 0, 0

    -- PIR timer, occupancy, and priority descriptions
    ME.AV25_Desc = "PIR Timer (M)"
    ME.AV25_Min = 5
	ME.AV25_Max = 30
	ME.AV25_Inc = 1
    ME.AV26_Desc = "ActOcc" -- Effective Occupancy
    ME.AV27_Desc = "SptPriorValue" -- Priority override value
    ME.AV27_Min, ME.AV27_Max, ME.AV27_Inc = 4, 16, 1

    -- Lua-specific parameter safety defaults
    ME.AV25_PV[17] = PIR_TIMER_DEFAULT
    ME.AV27_PV[17] = SPT_PRIORITY_DEFAULT
	ME.AV28_PV[17] = DEFAULT_COMM_FAIL_TIME

    -- Variables
    PreviousHeartBeat, T1, T2, Standby = ME.AV30, 0, 0, 0
    PV = ME.AV27 -- Priority value

    init = true
end

if hasPIR then
	-- Movement or effective occupancy checks
	if ME.BV32 == 1 or ME.MSI33 ~= 1 then
		T2 = 0
		Standby = 0
	elseif ME.BV32 == 0 and ME.MSI33 == 1 then
		T2 = T2 + 1
	end

	-- Standby mode activation
	if ME.MSI33 == 1 and T2 > ME.AV25 * 60 then
		Standby = 1
	end

	-- Setpoints adjustment for custom standby mode
	if Standby == 1 and ME.MSI33 == 1 then
		local occupiedHeatSetpoint = ME.AV39_PV[PV] or ME.AV39_PV[17] or ME.AV39
		local occupiedCoolSetpoint = ME.AV40_PV[PV] or ME.AV40_PV[17] or ME.AV40

		ME.AV39_PV[4] = occupiedHeatSetpoint - ME.AV46
		ME.AV40_PV[4] = occupiedCoolSetpoint + ME.AV46

		ME.AV41 = ME.AV39_PV[4]
		ME.AV42 = ME.AV40_PV[4]
	else
		ME.AV39_PV[4], ME.AV41 = nil, nil
		ME.AV40_PV[4], ME.AV42 = nil, nil
	end

	-- Update monitor variables
	ME.AV225 = T2
	ME.AV226 = Standby

	-- Effective Occupancy (AV26) updates
	if ME.MSI33 == 1 and Standby == 0 then
		ME.AV26 = 1 -- Occupied
	elseif ME.MSI33 == 1 and Standby == 1 then
		ME.AV26 = 4 -- Standby
	elseif ME.MSI33 == 2 then
		ME.AV26 = 2 -- Unoccupied
	elseif ME.MSI33 == 3 then
		ME.AV26 = 3 -- Override
	end

	-- Debugging print statements (if needed for testing)
	print("\nSP0 ", ME.AV39_PV[PV], "- SP17 ", ME.AV39_PV[17])
	-- print("T2:", T2, " PIR:", ME.BV32, " EffOcc:", ME.MSI33, " AV26:", ME.AV26)
end

-- Communication failure logic
CommFail = ME.AV28
print("CommFail @ ", CommFail)
print(" Now = ",T1)

if PreviousHeartBeat == ME.AV30 then
    T1 = T1 + 1
else
    T1 = 0
    PreviousHeartBeat = ME.AV30
end

-- Handle communication failure
if T1 > CommFail then
    ME.MV10 = 1 -- Revert to onboard schedule
    ME.CSV1 = "" -- Clear messages
    ME.AV29, ME.AV39, ME.AV40, ME.AV41, ME.AV42, ME.AV43, ME.AV44 = 0, nil, nil, nil, nil, nil, nil -- Reset variables
    ME.BO26, ME.BO27, ME.BO28, ME.BO29 = nil, nil, nil, nil -- Reset outputs
else
    ME.CSV1 = ""
end

-- Demand Response (DR) flag detection and response
if ME.AV29 > 0 then
    ME.CSV1 = "Grid Event in Progress!"
    ME.MV2 = 8
    ME.BV7 = 1
else
    ME.CSV1 = ""
    ME.MV2 = 1
    ME.BV7 = 0
end
