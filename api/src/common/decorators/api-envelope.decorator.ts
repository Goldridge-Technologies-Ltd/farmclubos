import { applyDecorators, type Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { ApiErrorDto, ResponseMetaDto } from "../http/api-response.dto.js";

type EnvelopeOptions = {
  status: number;
  description: string;
  /** The class describing `data`. Omit when the route returns no data. */
  type?: Type<unknown>;
  isArray?: boolean;
};

/**
 * Documents a success response in the envelope every route really returns:
 * `{ success, message, data, meta }`, with `data` typed by `type`.
 */
export function ApiEnvelope({ status, description, type, isArray }: EnvelopeOptions) {
  const data = !type
    ? { nullable: true, example: null }
    : isArray
      ? { type: "array", items: { $ref: getSchemaPath(type) } }
      : { $ref: getSchemaPath(type) };

  return applyDecorators(
    ApiExtraModels(ResponseMetaDto, ...(type ? [type] : [])),
    ApiResponse({
      status,
      description,
      schema: {
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Success" },
          data,
          meta: { $ref: getSchemaPath(ResponseMetaDto) },
        },
      },
    }),
  );
}

/** Documents failure responses in the `{ success, error, meta }` envelope. */
export function ApiErrors(...responses: Array<{ status: number; description: string }>) {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto, ResponseMetaDto),
    ...responses.map(({ status, description }) =>
      ApiResponse({
        status,
        description,
        schema: {
          type: "object",
          required: ["success", "error", "meta"],
          properties: {
            success: { type: "boolean", example: false },
            error: { $ref: getSchemaPath(ApiErrorDto) },
            meta: { $ref: getSchemaPath(ResponseMetaDto) },
          },
        },
      }),
    ),
  );
}
