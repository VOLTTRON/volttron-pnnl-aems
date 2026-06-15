-- CreateIndex
CREATE INDEX "configurations_createdAt" ON "Configuration"("createdAt");

-- CreateIndex
CREATE INDEX "configurations_updatedAt" ON "Configuration"("updatedAt");

-- CreateIndex
CREATE INDEX "configurations_setpointId" ON "Configuration"("setpointId");

-- CreateIndex
CREATE INDEX "configurations_mondayScheduleId" ON "Configuration"("mondayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_tuesdayScheduleId" ON "Configuration"("tuesdayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_wednesdayScheduleId" ON "Configuration"("wednesdayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_thursdayScheduleId" ON "Configuration"("thursdayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_fridayScheduleId" ON "Configuration"("fridayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_saturdayScheduleId" ON "Configuration"("saturdayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_sundayScheduleId" ON "Configuration"("sundayScheduleId");

-- CreateIndex
CREATE INDEX "configurations_holidayScheduleId" ON "Configuration"("holidayScheduleId");

-- CreateIndex
CREATE INDEX "controls_name" ON "Control"("name");

-- CreateIndex
CREATE INDEX "controls_campus" ON "Control"("campus");

-- CreateIndex
CREATE INDEX "controls_building" ON "Control"("building");

-- CreateIndex
CREATE INDEX "controls_campus_building" ON "Control"("campus", "building");

-- CreateIndex
CREATE INDEX "controls_createdAt" ON "Control"("createdAt");

-- CreateIndex
CREATE INDEX "controls_updatedAt" ON "Control"("updatedAt");

-- CreateIndex
CREATE INDEX "holidays_type" ON "Holiday"("type");

-- CreateIndex
CREATE INDEX "holidays_createdAt" ON "Holiday"("createdAt");

-- CreateIndex
CREATE INDEX "holidays_updatedAt" ON "Holiday"("updatedAt");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "locations_createdAt" ON "Location"("createdAt");

-- CreateIndex
CREATE INDEX "locations_updatedAt" ON "Location"("updatedAt");

-- CreateIndex
CREATE INDEX "occupancies_label" ON "Occupancy"("label");

-- CreateIndex
CREATE INDEX "occupancies_createdAt" ON "Occupancy"("createdAt");

-- CreateIndex
CREATE INDEX "occupancies_updatedAt" ON "Occupancy"("updatedAt");

-- CreateIndex
CREATE INDEX "occupancies_scheduleId" ON "Occupancy"("scheduleId");

-- CreateIndex
CREATE INDEX "occupancies_configurationId" ON "Occupancy"("configurationId");

-- CreateIndex
CREATE INDEX "schedules_createdAt" ON "Schedule"("createdAt");

-- CreateIndex
CREATE INDEX "schedules_updatedAt" ON "Schedule"("updatedAt");

-- CreateIndex
CREATE INDEX "schedules_setpointId" ON "Schedule"("setpointId");

-- CreateIndex
CREATE INDEX "setpoints_createdAt" ON "Setpoint"("createdAt");

-- CreateIndex
CREATE INDEX "setpoints_updatedAt" ON "Setpoint"("updatedAt");

-- CreateIndex
CREATE INDEX "units_name" ON "Unit"("name");

-- CreateIndex
CREATE INDEX "units_campus" ON "Unit"("campus");

-- CreateIndex
CREATE INDEX "units_building" ON "Unit"("building");

-- CreateIndex
CREATE INDEX "units_system" ON "Unit"("system");

-- CreateIndex
CREATE INDEX "units_campus_building" ON "Unit"("campus", "building");

-- CreateIndex
CREATE INDEX "units_campus_building_system" ON "Unit"("campus", "building", "system");

-- CreateIndex
CREATE INDEX "units_createdAt" ON "Unit"("createdAt");

-- CreateIndex
CREATE INDEX "units_updatedAt" ON "Unit"("updatedAt");

-- CreateIndex
CREATE INDEX "units_configurationId" ON "Unit"("configurationId");

-- CreateIndex
CREATE INDEX "units_controlId" ON "Unit"("controlId");

-- CreateIndex
CREATE INDEX "units_locationId" ON "Unit"("locationId");
