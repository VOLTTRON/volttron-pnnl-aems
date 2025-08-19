import { HttpStatusEnum, IHttpStatus } from ".";
import Base from "./base";

class HttpStatus extends Base<IHttpStatus> {
  constructor() {
    super(
      [
        {
          name: "continue",
          label: "Continue",
          enum: HttpStatusEnum.Information,
          statusText: "Continue",
          message:
            "The server has received the request headers and the client should proceed to send the request body.",
          status: 100,
        },
        {
          name: "switching-protocols",
          label: "Switching Protocols",
          enum: HttpStatusEnum.Information,
          statusText: "Switching Protocols",
          message: "The requester has asked the server to switch protocols and the server has agreed to do so.",
          status: 101,
        },
        {
          name: "processing",
          label: "Processing",
          enum: HttpStatusEnum.Information,
          statusText: "Processing",
          message: "The server is processing the request, but no response is available yet.",
          status: 102,
        },
        {
          name: "early-hints",
          label: "Early Hints",
          enum: HttpStatusEnum.Information,
          statusText: "Early Hints",
          message:
            "The server is likely to send a final response with the header fields included in the informational response.",
          status: 103,
        },
        {
          name: "ok",
          label: "OK",
          enum: HttpStatusEnum.Success,
          statusText: "OK",
          message: "The request has succeeded.",
          status: 200,
        },
        {
          name: "created",
          label: "Created",
          enum: HttpStatusEnum.Success,
          statusText: "Created",
          message: "The request has been fulfilled and resulted in a new resource being created.",
          status: 201,
        },
        {
          name: "accepted",
          label: "Accepted",
          enum: HttpStatusEnum.Success,
          statusText: "Accepted",
          message: "The request has been accepted for processing, but the processing has not been completed.",
          status: 202,
        },
        {
          name: "non-authoritative-information",
          label: "Non-Authoritative Information",
          enum: HttpStatusEnum.Success,
          statusText: "Non-Authoritative Information",
          message: "The request has been successfully processed, but that the information is from another source.",
          status: 203,
        },
        {
          name: "no-content",
          label: "No Content",
          enum: HttpStatusEnum.Success,
          statusText: "No Content",
          message: "The request has been successfully processed, but that the response is intentionally blank.",
          status: 204,
        },
        {
          name: "reset-content",
          label: "Reset Content",
          enum: HttpStatusEnum.Success,
          statusText: "Reset Content",
          message: "The request has been successfully processed, but that the response is intentionally blank.",
          status: 205,
        },
        {
          name: "partial-content",
          label: "Partial Content",
          enum: HttpStatusEnum.Success,
          statusText: "Partial Content",
          message: "The server is delivering only part of the resource due to a range header sent by the client.",
          status: 206,
        },
        {
          name: "multi-status",
          label: "Multi-Status",
          enum: HttpStatusEnum.Success,
          statusText: "Multi-Status",
          message:
            "The message body that follows is by default an XML message and can contain a number of separate response codes, depending on how many sub-requests were made.",
          status: 207,
        },
        {
          name: "already-reported",
          label: "Already Reported",
          enum: HttpStatusEnum.Success,
          statusText: "Already Reported",
          message:
            "The members of a DAV binding have already been enumerated in a preceding part of the (multistatus) response, and are not being included again.",
          status: 208,
        },
        {
          name: "im-used",
          label: "IM Used",
          enum: HttpStatusEnum.Success,
          statusText: "IM Used",
          message:
            "The server has fulfilled a request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.",
          status: 226,
        },
        {
          name: "multiple-choices",
          label: "Multiple Choices",
          enum: HttpStatusEnum.Redirect,
          statusText: "Multiple Choices",
          message: "The request has more than one possible response.",
          status: 300,
        },
        {
          name: "moved-permanently",
          label: "Moved Permanently",
          enum: HttpStatusEnum.Redirect,
          statusText: "Moved Permanently",
          message: "The URL of the requested resource has been changed permanently.",
          status: 301,
        },
        {
          name: "found",
          label: "Found",
          enum: HttpStatusEnum.Redirect,
          statusText: "Found",
          message: "The URL of the requested resource has been changed temporarily.",
          status: 302,
        },
        {
          name: "see-other",
          label: "See Other",
          enum: HttpStatusEnum.Redirect,
          statusText: "See Other",
          message: "The server is directing the client to look at a different URL.",
          status: 303,
        },
        {
          name: "not-modified",
          label: "Not Modified",
          enum: HttpStatusEnum.Redirect,
          statusText: "Not Modified",
          message: "The request has not been modified since the specified date.",
          status: 304,
        },
        {
          name: "use-proxy",
          label: "Use Proxy",
          enum: HttpStatusEnum.Redirect,
          statusText: "Use Proxy",
          message: "The request must be made through the proxy given by the Location field.",
          status: 305,
        },
        {
          name: "switch-proxy",
          label: "Switch Proxy",
          enum: HttpStatusEnum.Redirect,
          statusText: "Switch Proxy",
          message: "No longer used.",
          status: 306,
        },
        {
          name: "temporary-redirect",
          label: "Temporary Redirect",
          enum: HttpStatusEnum.Redirect,
          statusText: "Temporary Redirect",
          message: "The request should be repeated with another URI.",
          status: 307,
        },
        {
          name: "permanent-redirect",
          label: "Permanent Redirect",
          enum: HttpStatusEnum.Redirect,
          statusText: "Permanent Redirect",
          message: "The request and all future requests should be repeated using another URI.",
          status: 308,
        },
        {
          name: "bad-request",
          label: "Bad Request",
          enum: HttpStatusEnum.ClientError,
          statusText: "Bad Request",
          message: "The request cannot be fulfilled due to bad syntax.",
          status: 400,
        },
        {
          name: "unauthorized",
          label: "Unauthorized",
          enum: HttpStatusEnum.ClientError,
          statusText: "Unauthorized",
          message: "The request was a legal request, but the server is refusing to respond to it.",
          status: 401,
        },
        {
          name: "payment-required",
          label: "Payment Required",
          enum: HttpStatusEnum.ClientError,
          statusText: "Payment Required",
          message: "Reserved for future use.",
          status: 402,
        },
        {
          name: "forbidden",
          label: "Forbidden",
          enum: HttpStatusEnum.ClientError,
          statusText: "Forbidden",
          message: "The request was a legal request, but the server is refusing to respond to it.",
          status: 403,
        },
        {
          name: "not-found",
          label: "Not Found",
          enum: HttpStatusEnum.ClientError,
          statusText: "Not Found",
          message: "The requested resource could not be found but may be available in the future.",
          status: 404,
        },
        {
          name: "method-not-allowed",
          label: "Method Not Allowed",
          enum: HttpStatusEnum.ClientError,
          statusText: "Method Not Allowed",
          message: "A request was made of a resource using a request method not supported by that resource.",
          status: 405,
        },
        {
          name: "not-acceptable",
          label: "Not Acceptable",
          enum: HttpStatusEnum.ClientError,
          statusText: "Not Acceptable",
          message:
            "The requested resource is only capable of generating content not acceptable according to the Accept headers sent in the request.",
          status: 406,
        },
        {
          name: "proxy-authentication-required",
          label: "Proxy Authentication Required",
          enum: HttpStatusEnum.ClientError,
          statusText: "Proxy Authentication Required",
          message: "The client must first authenticate itself with the proxy.",
          status: 407,
        },
        {
          name: "request-timeout",
          label: "Request Timeout",
          enum: HttpStatusEnum.ClientError,
          statusText: "Request Timeout",
          message: "The server timed out waiting for the request.",
          status: 408,
        },
        {
          name: "conflict",
          label: "Conflict",
          enum: HttpStatusEnum.ClientError,
          statusText: "Conflict",
          message: "The request could not be processed because of conflict in the request.",
          status: 409,
        },
        {
          name: "gone",
          label: "Gone",
          enum: HttpStatusEnum.ClientError,
          statusText: "Gone",
          message: "The resource requested is no longer available and will not be available again.",
          status: 410,
        },
        {
          name: "length-required",
          label: "Length Required",
          enum: HttpStatusEnum.ClientError,
          statusText: "Length Required",
          message:
            "The request did not specify the length of its content, which is required by the requested resource.",
          status: 411,
        },
        {
          name: "precondition-failed",
          label: "Precondition Failed",
          enum: HttpStatusEnum.ClientError,
          statusText: "Precondition Failed",
          message: "The server does not meet one of the preconditions that the requester put on the request.",
          status: 412,
        },
        {
          name: "payload-too-large",
          label: "Payload Too Large",
          enum: HttpStatusEnum.ClientError,
          statusText: "Payload Too Large",
          message: "The request is larger than the server is willing or able to process.",
          status: 413,
        },
        {
          name: "uri-too-long",
          label: "URI Too Long",
          enum: HttpStatusEnum.ClientError,
          statusText: "URI Too Long",
          message: "The URI provided was too long for the server to process.",
          status: 414,
        },
        {
          name: "unsupported-media-type",
          label: "Unsupported Media Type",
          enum: HttpStatusEnum.ClientError,
          statusText: "Unsupported Media Type",
          message: "The request entity has a media type which the server or resource does not support.",
          status: 415,
        },
        {
          name: "range-not-satisfiable",
          label: "Range Not Satisfiable",
          enum: HttpStatusEnum.ClientError,
          statusText: "Range Not Satisfiable",
          message: "The client has asked for a portion of the file, but the server cannot supply that portion.",
          status: 416,
        },
        {
          name: "expectation-failed",
          label: "Expectation Failed",
          enum: HttpStatusEnum.ClientError,
          statusText: "Expectation Failed",
          message: "The server cannot meet the requirements of the Expect request-header field.",
          status: 417,
        },
        {
          name: "im-a-teapot",
          label: "I'm a teapot",
          enum: HttpStatusEnum.ClientError,
          statusText: "I'm a teapot",
          message: "I'm a teapot.",
          status: 418,
        },
        {
          name: "misdirected-request",
          label: "Misdirected Request",
          enum: HttpStatusEnum.ClientError,
          statusText: "Misdirected Request",
          message: "The request was directed at a server that is not able to produce a response.",
          status: 421,
        },
        {
          name: "unprocessable-entity",
          label: "Unprocessable Entity",
          enum: HttpStatusEnum.ClientError,
          statusText: "Unprocessable Entity",
          message: "The request was well-formed but was unable to be followed due to semantic errors.",
          status: 422,
        },
        {
          name: "locked",
          label: "Locked",
          enum: HttpStatusEnum.ClientError,
          statusText: "Locked",
          message: "The resource that is being accessed is locked.",
          status: 423,
        },
        {
          name: "failed-dependency",
          label: "Failed Dependency",
          enum: HttpStatusEnum.ClientError,
          statusText: "Failed Dependency",
          message: "The request failed due to failure of a previous request.",
          status: 424,
        },
        {
          name: "too-early",
          label: "Too Early",
          enum: HttpStatusEnum.ClientError,
          statusText: "Too Early",
          message: "Indicates that the server is unwilling to risk processing a request that might be replayed.",
          status: 425,
        },
        {
          name: "upgrade-required",
          label: "Upgrade Required",
          enum: HttpStatusEnum.ClientError,
          statusText: "Upgrade Required",
          message: "The client should switch to a different protocol such as TLS/1.0.",
          status: 426,
        },
        {
          name: "precondition-required",
          label: "Precondition Required",
          enum: HttpStatusEnum.ClientError,
          statusText: "Precondition Required",
          message: "The origin server requires the request to be conditional.",
          status: 428,
        },
        {
          name: "too-many-requests",
          label: "Too Many Requests",
          enum: HttpStatusEnum.ClientError,
          statusText: "Too Many Requests",
          message: "The user has sent too many requests in a given amount of time.",
          status: 429,
        },
        {
          name: "request-header-fields-too-large",
          label: "Request Header Fields Too Large",
          enum: HttpStatusEnum.ClientError,
          statusText: "Request Header Fields Too Large",
          message:
            "The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large.",
          status: 431,
        },
        {
          name: "unavailable-for-legal-reasons",
          label: "Unavailable For Legal Reasons",
          enum: HttpStatusEnum.ClientError,
          statusText: "Unavailable For Legal Reasons",
          message: "The resource is unavailable for legal reasons.",
          status: 451,
        },
        {
          name: "internal-server-error",
          label: "Internal Server Error",
          enum: HttpStatusEnum.ServerError,
          statusText: "Internal Server Error",
          message:
            "A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.",
          status: 500,
        },
        {
          name: "not-implemented",
          label: "Not Implemented",
          enum: HttpStatusEnum.ServerError,
          statusText: "Not Implemented",
          message:
            "The server either does not recognize the request method, or it lacks the ability to fulfill the request.",
          status: 501,
        },
        {
          name: "bad-gateway",
          label: "Bad Gateway",
          enum: HttpStatusEnum.ServerError,
          statusText: "Bad Gateway",
          message:
            "The server was acting as a gateway or proxy and received an invalid response from the upstream server.",
          status: 502,
        },
        {
          name: "service-unavailable",
          label: "Service Unavailable",
          enum: HttpStatusEnum.ServerError,
          statusText: "Service Unavailable",
          message: "The server is currently unavailable (because it is overloaded or down for maintenance).",
          status: 503,
        },
        {
          name: "gateway-timeout",
          label: "Gateway Timeout",
          enum: HttpStatusEnum.ServerError,
          statusText: "Gateway Timeout",
          message:
            "The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.",
          status: 504,
        },
        {
          name: "http-version-not-supported",
          label: "HTTP Version Not Supported",
          enum: HttpStatusEnum.ServerError,
          statusText: "HTTP Version Not Supported",
          message: "The server does not support the HTTP protocol version used in the request.",
          status: 505,
        },
        {
          name: "variant-also-negotiates",
          label: "Variant Also Negotiates",
          enum: HttpStatusEnum.ServerError,
          statusText: "Variant Also Negotiates",
          message: "Transparent content negotiation for the request results in a circular reference.",
          status: 506,
        },
        {
          name: "insufficient-storage",
          label: "Insufficient Storage",
          enum: HttpStatusEnum.ServerError,
          statusText: "Insufficient Storage",
          message: "The server is unable to store the representation needed to complete the request.",
          status: 507,
        },
        {
          name: "loop-detected",
          label: "Loop Detected",
          enum: HttpStatusEnum.ServerError,
          statusText: "Loop Detected",
          message: "The server detected an infinite loop while processing the request.",
          status: 508,
        },
        {
          name: "not-extended",
          label: "Not Extended",
          enum: HttpStatusEnum.ServerError,
          statusText: "Not Extended",
          message: "Further extensions to the request are required for the server to fulfill it.",
          status: 510,
        },
        {
          name: "network-authentication-required",
          label: "Network Authentication Required",
          enum: HttpStatusEnum.ServerError,
          statusText: "Network Authentication Required",
          message: "The client needs to authenticate to gain network access.",
          status: 511,
        },
      ],
      (_c, v) => ({ ...v, ...{ statusCode: `${v.status}` } })
    );
  }

  // static references to objects
  Continue = this.parseStrict("continue");
  SwitchingProtocols = this.parseStrict("switching-protocols");
  Processing = this.parseStrict("processing");
  EarlyHints = this.parseStrict("early-hints");
  OK = this.parseStrict("ok");
  Created = this.parseStrict("created");
  Accepted = this.parseStrict("accepted");
  NonAuthoritativeInformation = this.parseStrict("non-authoritative-information");
  NoContent = this.parseStrict("no-content");
  ResetContent = this.parseStrict("reset-content");
  PartialContent = this.parseStrict("partial-content");
  MultiStatus = this.parseStrict("multi-status");
  AlreadyReported = this.parseStrict("already-reported");
  IMUsed = this.parseStrict("im-used");
  MultipleChoices = this.parseStrict("multiple-choices");
  MovedPermanently = this.parseStrict("moved-permanently");
  Found = this.parseStrict("found");
  SeeOther = this.parseStrict("see-other");
  NotModified = this.parseStrict("not-modified");
  UseProxy = this.parseStrict("use-proxy");
  SwitchProxy = this.parseStrict("switch-proxy");
  TemporaryRedirect = this.parseStrict("temporary-redirect");
  PermanentRedirect = this.parseStrict("permanent-redirect");
  BadRequest = this.parseStrict("bad-request");
  Unauthorized = this.parseStrict("unauthorized");
  PaymentRequired = this.parseStrict("payment-required");
  Forbidden = this.parseStrict("forbidden");
  NotFound = this.parseStrict("not-found");
  MethodNotAllowed = this.parseStrict("method-not-allowed");
  NotAcceptable = this.parseStrict("not-acceptable");
  ProxyAuthenticationRequired = this.parseStrict("proxy-authentication-required");
  RequestTimeout = this.parseStrict("request-timeout");
  Conflict = this.parseStrict("conflict");
  Gone = this.parseStrict("gone");
  LengthRequired = this.parseStrict("length-required");
  PreconditionFailed = this.parseStrict("precondition-failed");
  PayloadTooLarge = this.parseStrict("payload-too-large");
  URITooLong = this.parseStrict("uri-too-long");
  UnsupportedMediaType = this.parseStrict("unsupported-media-type");
  RangeNotSatisfiable = this.parseStrict("range-not-satisfiable");
  ExpectationFailed = this.parseStrict("expectation-failed");
  ImATeapot = this.parseStrict("im-a-teapot");
  MisdirectedRequest = this.parseStrict("misdirected-request");
  UnprocessableEntity = this.parseStrict("unprocessable-entity");
  Locked = this.parseStrict("locked");
  FailedDependency = this.parseStrict("failed-dependency");
  TooEarly = this.parseStrict("too-early");
  UpgradeRequired = this.parseStrict("upgrade-required");
  PreconditionRequired = this.parseStrict("precondition-required");
  TooManyRequests = this.parseStrict("too-many-requests");
  RequestHeaderFieldsTooLarge = this.parseStrict("request-header-fields-too-large");
  UnavailableForLegalReasons = this.parseStrict("unavailable-for-legal-reasons");
  InternalServerError = this.parseStrict("internal-server-error");
  NotImplemented = this.parseStrict("not-implemented");
  BadGateway = this.parseStrict("bad-gateway");
  ServiceUnavailable = this.parseStrict("service-unavailable");
  GatewayTimeout = this.parseStrict("gateway-timeout");
  HTTPVersionNotSupported = this.parseStrict("http-version-not-supported");
  VariantAlsoNegotiates = this.parseStrict("variant-also-negotiates");
  InsufficientStorage = this.parseStrict("insufficient-storage");
  LoopDetected = this.parseStrict("loop-detected");
  NostatusTextended = this.parseStrict("not-extended");
  NetworkAuthenticationRequired = this.parseStrict("network-authentication-required");
}

const httpStatus = new HttpStatus();

export default httpStatus;
