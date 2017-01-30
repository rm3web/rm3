var states = require ('../../lib/states');
var should = require('chai').should();

describe('publishWorkflow', function() {
  it('should publish normally', function() {
    var workflow = {};
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('published');
  });

  it('should approve', function() {
    var workflow = {needsReview: true};
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('review');
    states.publishWorkflow.approve(workflow);
    states.getPublishingState(workflow).should.equal('published');
  });

  it('should reject', function() {
    var workflow = {needsReview: true};
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('review');
    states.publishWorkflow.reject(workflow);
    states.getPublishingState(workflow).should.equal('rejected');
  });

  it('should allow edits to rejected drafts', function() {
    var workflow = {needsReview: true};
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('review');
    states.publishWorkflow.reject(workflow);
    states.getPublishingState(workflow).should.equal('rejected');
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('review');
  });

  it('should allow edits to rejected drafts after permission change', function() {
    var workflow = {needsReview: true};
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('review');
    states.publishWorkflow.reject(workflow);
    states.getPublishingState(workflow).should.equal('rejected');
    workflow.needsReview = false;
    states.publishWorkflow.publishDraft(workflow);
    states.getPublishingState(workflow).should.equal('published');
  });
});

describe('processingWorkflow', function() {
  it('should handle multiple edits', function() {
    var workflow = {};
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
  });

  it('should handle completion', function() {
    var workflow = {};
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.processingComplete(workflow);
    states.getProcessingState(workflow).should.equal('processed');
  });

  it('should handle errors', function() {
    var workflow = {};
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.error(workflow);
    states.getProcessingState(workflow).should.equal('error');
  });

  it('should handle error recovery', function() {
    var workflow = {};
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.error(workflow);
    states.getProcessingState(workflow).should.equal('error');
    states.processingWorkflow.edit(workflow);
    states.getProcessingState(workflow).should.equal('processing');
    states.processingWorkflow.processingComplete(workflow);
    states.getProcessingState(workflow).should.equal('processed');
  });
});
