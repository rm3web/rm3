var machina = require('machina');

var processingWorkflow = new machina.BehavioralFsm({
  namespace: "processing",
  initialState: "uninitialized",

  states: {
    uninitialized: {
      "*": function(client) {
        this.deferUntilTransition(client);
        this.transition(client, "processing");
      }
    },
    processing: {
      processingComplete: function(client) {
        this.transition(client, "processed");
      },
      edit: function(client) {
        this.transition(client, "processing");
      },
      error: function(client) {
        this.transition(client, "error");
      }
    },
    processed: {
      edit: "processing"
    },
    error: {

    }
  },

  error: function(client) {
    this.handle(client, "error");
  },
  edit: function(client) {
    this.transition(client, "processing");
  },
  processingComplete: function(client) {
    this.handle(client, "processingComplete");
  }
});

exports.getProcessingState = function(client) {
  return client['__machina__'].processing.state;
}

var publishWorkflow = new machina.BehavioralFsm({
  namespace: "publish",
  initialState: "uninitialized",

  states: {
    uninitialized: {
      "*": function(client) {
        this.deferUntilTransition(client);
        this.transition(client, "draft");
      }
    },
    draft: {
      publishDraft: function(client) {
        if (client.needsReview) {
          this.transition(client, "review");
        } else {
          this.transition(client, "published");
        }
      }
    },
    review: {
      approve: 'published',
      reject: 'rejected'
    },
    rejected: {
      publishDraft: function(client) {
        if (client.needsReview) {
          this.transition(client, "review");
        } else {
          this.transition(client, "published");
        }
      }
    },
    published: {
    }
  },

  approve: function(client) {
    this.handle(client, "approve");
  },
  reject: function(client) {
    this.handle(client, "reject");
  },
  publishDraft: function(client) {
    this.handle(client, "publishDraft");
  }
});

exports.getPublishingState = function(client) {
  return client['__machina__'].publish.state;
}

exports.processingWorkflow = processingWorkflow;
exports.publishWorkflow = publishWorkflow;
