--SE_VT8000 Network Heartbeat and Grid Event Status

if not init then
    -- Configuration Section
    ME.BV7 = 0 -- Display long message @ ME.CSV2
    -- ME.CSV2 = '' -- Long message
    ME.MV6 = 2 -- imperial units
    ME.MV58 = 1 -- Detach setpoint
    ME.MV72 = 2 -- Has economizer
    ME.MV79 = 2 -- clg during econ ON
    ME.MV119 = 2 -- HP
    ME.MV17 = 3 -- Fan on during occ
    ME.AV25_Desc = "CommFailTmr"
    ME.AV25_Min = 90
    ME.AV25_Max = 900
    ME.AV25 = 600 -- 10 network failure to trigger full release
    ME.CSV1 = nil
    --ME.CSV1 = ("Waiting For Network Heartbeat")
    ME.AV30_Desc = "Netwk HeartBt"
    ME.AV29_Desc = "DR Flag"
    ME.AV30 = 0
    ME.AV29 = 0
    PreviousHeartBeat = ME.AV30
    T1 = 0
    init = true
end


CommFail = ME.AV25
print("CommFail @ ", CommFail)
print(" Now = ",T1)

if PreviousHeartBeat == ME.AV30 then
    T1 = T1 + 1
else
    T1 = 0
    PreviousHeartBeat = ME.AV30
end

if (T1 > CommFail) then 
    ME.CSV1 = ("Communication Failure!")
    ME.MV10 = 1
    ME.AV39 = nil
    ME.AV40 = nil
    ME.BO26 = nil
    ME.BO27 = nil
    ME.BO28 = nil
    ME.BO29 = nil
else
    ME.CSV1 = ""
end

if ME.AV29 > 0 then
    ME.CSV1 = "Grid Event in Progress"
    ME.MV2 = 8
else
    ME.CSV1 = nil
    ME.MV2 = 1
end

