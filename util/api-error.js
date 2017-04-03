class ApiError extends Error {

  constructor(msg, err) {
    super(msg);
    if (err.error && err.error.errorCode) {
      let message = `${msg}: [${err.statusCode}] ${err.error.errorSummary}. Causes: ${JSON.stringify(err.error.errorCauses)}`;
      this.name = 'ApiError';
      this.message = message;
      this.stack = undefined;
    }
    else {
      this.name = 'Error';
      this.stack = err.stack;
      this.message = msg;
    }
  }

}

module.exports = ApiError;
