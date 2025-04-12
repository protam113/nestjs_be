### 2xx - Success

- **200 OK**: The request was successful and the data is returned.
- **201 Created**: The request was successfully processed, and a new resource was created.
- **202 Accepted**: The request has been accepted for processing, but the processing is not yet complete.
- **203 Non-Authoritative Information**: The returned data is not from the original source.
- **204 No Content**: The request was successful, but there is no data to return.
- **205 Reset Content**: The request was successful, and the user should reset the content (e.g., reset a form).
- **206 Partial Content**: A part of the resource was returned, typically used for partial downloads.

### 3xx - Redirection

- **300 Multiple Choices**: Multiple choices exist for the requested resource.
- **301 Moved Permanently**: The resource has permanently moved to a new URL.
- **302 Found**: The resource has temporarily moved to a different URL.
- **303 See Other**: The next request should use the GET method at the new URL.
- **304 Not Modified**: The resource has not been modified since the last request.
- **305 Use Proxy**: The resource can only be accessed through a proxy.
- **307 Temporary Redirect**: The resource has temporarily moved, but the HTTP method should remain the same.
- **308 Permanent Redirect**: The resource has permanently moved, and the HTTP method should remain the same.

### 4xx - Client Error

- **400 Bad Request**: The request is invalid (client-side error).
- **401 Unauthorized**: Authentication is required to access the resource.
- **402 Payment Required**: Reserved for future use, typically for payment purposes.
- **403 Forbidden**: The user does not have permission to access the resource.
- **404 Not Found**: The requested resource could not be found.
- **405 Method Not Allowed**: The HTTP method is not allowed for the requested resource.
- **406 Not Acceptable**: The requested resource cannot be returned in the format requested.
- **407 Proxy Authentication Required**: Authentication is required to access the resource via a proxy.
- **408 Request Timeout**: The server timed out waiting for the request.
- **409 Conflict**: There is a conflict when processing the request (e.g., duplicate data).
- **410 Gone**: The resource is no longer available and has been permanently deleted.
- **411 Length Required**: The request must specify a `Content-Length`.
- **412 Precondition Failed**: The preconditions in the request headers were not met.
- **413 Payload Too Large**: The request payload is too large to process.
- **414 URI Too Long**: The URI is too long to process.
- **415 Unsupported Media Type**: The media type of the request is not supported.
- **416 Range Not Satisfiable**: The requested range cannot be fulfilled.
- **417 Expectation Failed**: The expectation in the request's `Expect` header cannot be met.
- **418 I'm a teapot**: A humorous error from RFC 2324 (not a real error).
- **421 Misdirected Request**: The request was sent to the wrong server.
- **422 Unprocessable Entity**: The resource cannot be processed due to invalid data.
- **423 Locked**: The resource is locked.
- **424 Failed Dependency**: The request failed due to a failed dependency.
- **425 Too Early**: The request is too early to process.
- **426 Upgrade Required**: The client should switch to a different protocol.
- **428 Precondition Required**: The request must include a precondition.
- **429 Too Many Requests**: Too many requests were sent in a short time.
- **431 Request Header Fields Too Large**: The headers in the request are too large.
- **451 Unavailable For Legal Reasons**: The resource is unavailable for legal reasons.

### 5xx - Server Error

- **500 Internal Server Error**: A generic server-side error, the request could not be completed.
- **501 Not Implemented**: The requested HTTP method is not supported by the server.
- **502 Bad Gateway**: The server received an invalid response from an upstream server.
- **503 Service Unavailable**: The server is temporarily unavailable due to overload or maintenance.
- **504 Gateway Timeout**: The gateway server did not receive a timely response from the upstream server.
- **505 HTTP Version Not Supported**: The requested HTTP version is not supported by the server.
- **506 Variant Also Negotiates**: A content negotiation error occurred.
- **507 Insufficient Storage**: The server does not have enough storage to process the request.
- **508 Loop Detected**: A loop was detected during request processing.
- **510 Not Extended**: The request lacks the necessary information for the server to process it.
- **511 Network Authentication Required**: Network authentication is required to access the resource.

### Summary

- **200-299** status codes indicate that the request was successful.
- **300-399** status codes indicate that the request requires redirection.
- **400-499** status codes indicate client-side errors.
- **500-599** status codes indicate server-side errors.
