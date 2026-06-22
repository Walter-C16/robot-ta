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

class TemporarilyUnavailableError extends Error {
    constructor(message = "The server is temporarily unavailable") {
        super(message);
        this.name = "TemporarilyUnavailableError";
        this.statusCode = 503;
    }
}

class InternalServerError extends Error {
    constructor(message = "The server was unable to complete your request") {
        super(message);
        this.name = "InternalServerError";
        this.statusCode = 500;
    }
}

module.exports = {
    BadRequestError,
    TargetAnalysisError,
    TargetTimeoutError,
    TemporarilyUnavailableError,
    InternalServerError,
};
