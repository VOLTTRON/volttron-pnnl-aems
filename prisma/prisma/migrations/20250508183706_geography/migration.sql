-- CreateTable
CREATE TABLE "Geography" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "geojson" JSON NOT NULL,
    "geometry" geography(GEOMETRY,4326),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Geography_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "geography_name" ON "Geography"("name");

-- CreateIndex
CREATE INDEX "geography_group" ON "Geography"("group");

-- CreateIndex
CREATE INDEX "geography_type" ON "Geography"("type");

-- CreateIndex
CREATE INDEX "geography_geometry" ON "Geography" USING GIST("geometry");

-- CreateFunction
CREATE OR REPLACE FUNCTION GEOGRAPHY_GEOMETRY_TRIGGER() RETURNS TRIGGER AS $$
BEGIN
	IF NEW."geojson" IS NOT null THEN
    	NEW."geometry" = ST_SetSRID(ST_GeomFromGeoJSON(NEW."geojson"->>'geometry'), 4326);
	END IF;
    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- CreateTrigger
CREATE OR REPLACE TRIGGER "Geography_after_update"
BEFORE INSERT OR UPDATE ON "Geography"
FOR EACH ROW EXECUTE FUNCTION GEOGRAPHY_GEOMETRY_TRIGGER();
