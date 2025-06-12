import { SetMetadata } from "@nestjs/common";

/**
 * A metadata key for Pothos decorators.
 */
export const PothosBuilderKey = Symbol("pothos_builder");

/**
 * A metadata key for Pothos decorators.
 */
export const PothosObjectKey = Symbol("pothos_object");

/**
 * A metadata key for Pothos decorators.
 */
export const PothosInputKey = Symbol("pothos_input");

/**
 * A metadata key for Pothos decorators.
 */
export const PothosQueryKey = Symbol("pothos_query");

/**
 * A metadata key for Pothos decorators.
 */
export const PothosMutationKey = Symbol("pothos_mutation");

/**
 * Designates a class as the Pothos schema builder.
 * @returns
 */
export const PothosBuilder = () => SetMetadata(PothosBuilderKey, true);

/**
 * Designates a class as a Pothos object and optionally fields.
 * @returns
 */
export const PothosObject = () => SetMetadata(PothosObjectKey, true);

/**
 * Designates a class as a collection of Pothos input parameters.
 * @returns
 */
export const PothosInput = () => SetMetadata(PothosInputKey, true);

/**
 * Designates a class as a collection of Pothos queries.
 * @returns
 */
export const PothosQuery = () => SetMetadata(PothosQueryKey, true);

/**
 * Designates a class as a collection of Pothos mutations.
 * @returns
 */
export const PothosMutation = () => SetMetadata(PothosMutationKey, true);
