export class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static ok(data, message = "Success") {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = "Created") {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = "No content") {
    return new ApiResponse(204, null, message);
  }
}
