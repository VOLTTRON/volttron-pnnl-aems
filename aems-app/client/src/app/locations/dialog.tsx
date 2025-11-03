"use client";

import { FormGroup, InputGroup, NumericInput } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadLocationsDocument,
  ReadLocationsQuery,
  DeleteLocationDocument,
  CreateLocationDocument,
  UpdateLocationDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateLocation({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const [createLocation] = useMutation(CreateLocationDocument, {
    refetchQueries: [ReadLocationsDocument],
  });

  const onCreate = useCallback(async () => {
    if (!name || latitude === undefined || longitude === undefined) {
      return;
    }

    await createLocation({
      variables: {
        create: {
          name,
          latitude,
          longitude,
        },
      },
    });
  }, [createLocation, name, latitude, longitude]);

  useEffect(() => {
    if (open) {
      setName("");
      setLatitude(undefined);
      setLongitude(undefined);
    }
  }, [open]);

  return (
    <CreateDialog title="Create Location" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Name" labelInfo="(required)">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Latitude" labelInfo="(required)">
        <NumericInput
          id="latitude"
          value={latitude}
          onValueChange={setLatitude}
          stepSize={0.000001}
          minorStepSize={0.000001}
          majorStepSize={0.1}
          fill
        />
      </FormGroup>
      <FormGroup label="Longitude" labelInfo="(required)">
        <NumericInput
          id="longitude"
          value={longitude}
          onValueChange={setLongitude}
          stepSize={0.000001}
          minorStepSize={0.000001}
          majorStepSize={0.1}
          fill
        />
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateLocation({
  open,
  setOpen,
  icon,
  location: locationData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  location?: NonNullable<ReadLocationsQuery["readLocations"]>[0];
}) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const [updateLocation] = useMutation(UpdateLocationDocument, {
    refetchQueries: [ReadLocationsDocument],
  });

  const onUpdate = useCallback(async () => {
    if (!locationData?.id) {
      return;
    }

    const updateData: any = {};

    if (name !== locationData?.name) updateData.name = name;
    if (latitude !== locationData?.latitude) updateData.latitude = latitude;
    if (longitude !== locationData?.longitude) updateData.longitude = longitude;

    await updateLocation({
      variables: {
        where: { id: locationData.id },
        update: updateData,
      },
    });
  }, [updateLocation, locationData, name, latitude, longitude]);

  useEffect(() => {
    if (open && locationData) {
      setName(locationData.name ?? "");
      setLatitude(locationData.latitude ?? undefined);
      setLongitude(locationData.longitude ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Location" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Name" labelInfo="(required)">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Latitude" labelInfo="(required)">
        <NumericInput
          id="latitude"
          value={latitude}
          onValueChange={setLatitude}
          stepSize={0.000001}
          minorStepSize={0.000001}
          majorStepSize={0.1}
          fill
        />
      </FormGroup>
      <FormGroup label="Longitude" labelInfo="(required)">
        <NumericInput
          id="longitude"
          value={longitude}
          onValueChange={setLongitude}
          stepSize={0.000001}
          minorStepSize={0.000001}
          majorStepSize={0.1}
          fill
        />
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteLocation({
  open,
  setOpen,
  icon,
  location,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  location?: NonNullable<ReadLocationsQuery["readLocations"]>[0];
}) {
  const [deleteLocation] = useMutation(DeleteLocationDocument, {
    refetchQueries: [ReadLocationsDocument],
  });

  const onDelete = useCallback(async () => {
    if (!location?.id) {
      return;
    }

    await deleteLocation({
      variables: {
        where: { id: location.id },
      },
    });
  }, [deleteLocation, location]);

  return (
    <DeleteDialog title="Delete Location" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the location '${location?.name}'?`}</p>
    </DeleteDialog>
  );
}
