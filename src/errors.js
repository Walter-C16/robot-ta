class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

class TargetAnalysisError extends Error {
  constructor(message = "Target could not be analyzed") {
    super(message);
    this.name = "TargetAnalysisError";
    this.statusCode = 422;
  }
}

class TargetTimeoutError extends Error {
  constructor(message = "Timeout while loading target page") {
    super(message);
    this.name = "TargetTimeoutError";
    this.statusCode = 504;
  }
}

module.exports = {
  BadRequestError,
  TargetAnalysisError,
  TargetTimeoutError
};
