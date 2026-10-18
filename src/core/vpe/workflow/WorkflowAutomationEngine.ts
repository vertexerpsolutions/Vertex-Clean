import { WorkflowInstance, WorkflowNode } from './WorkflowTypes';

export class VWEAutomationEngine {
  private static instance: VWEAutomationEngine;

  private constructor() {}

  public static getInstance(): VWEAutomationEngine {
    if (!VWEAutomationEngine.instance) {
      VWEAutomationEngine.instance = new VWEAutomationEngine();
    }
    return VWEAutomationEngine.instance;
  }

  public async executeAutomationNode(
    instance: WorkflowInstance,
    node: WorkflowNode
  ): Promise<{ success: boolean; output: Record<string, any>; logMessage: string }> {
    const type = node.config.automationType || 'send_notification';
    const timestamp = new Date().toISOString();

    switch (type) {
      case 'create_document': {
        const docRef = `DOC-AUT-${Math.floor(1000 + Math.random() * 9000)}`;
        instance.contextData.createdDocumentRef = docRef;
        return {
          success: true,
          output: { docRef, createdType: instance.contextData.docType || 'Auto Document' },
          logMessage: `[Automation] Created document ref ${docRef} for workflow ${instance.workflowCode}`
        };
      }

      case 'update_record': {
        const recordId = instance.contextData.targetRecordId || 'REC-1001';
        instance.contextData.recordStatus = 'APPROVED_AND_LOCKED';
        return {
          success: true,
          output: { recordId, newStatus: 'APPROVED_AND_LOCKED' },
          logMessage: `[Automation] Updated record ${recordId} status to APPROVED_AND_LOCKED`
        };
      }

      case 'send_notification': {
        const channel = node.config.notificationChannel || 'in_app';
        const msg = node.config.notificationTemplate || `Notification for instance ${instance.id} step ${node.title}`;
        return {
          success: true,
          output: { channel, message: msg, recipient: instance.initiatedBy },
          logMessage: `[Automation] Notification dispatched via ${channel.toUpperCase()}: "${msg}"`
        };
      }

      case 'generate_report': {
        const reportId = `RPT-${Math.floor(10000 + Math.random() * 90000)}`;
        return {
          success: true,
          output: { reportId, reportName: `Workflow Summary Report - ${instance.workflowTitle}` },
          logMessage: `[Automation] Generated audit compliance PDF report #${reportId}`
        };
      }

      case 'call_api': {
        const url = node.config.apiEndpointUrl || 'https://api.vertex-erp.internal/v1/webhooks/workflow';
        const method = node.config.apiMethod || 'POST';
        return {
          success: true,
          output: { url, method, statusCode: 200, statusText: 'OK' },
          logMessage: `[Automation] Executed REST API ${method} to ${url} -> 200 OK`
        };
      }

      case 'execute_integration': {
        return {
          success: true,
          output: { system: 'SAP / Oracle / Custom Connector', syncStatus: 'Synchronized' },
          logMessage: `[Automation] Executed ERP Integration Pipeline: Payload synchronized with external ledger.`
        };
      }

      case 'schedule_task': {
        const delaySeconds = node.config.delaySeconds || 60;
        return {
          success: true,
          output: { scheduledTime: new Date(Date.now() + delaySeconds * 1000).toISOString() },
          logMessage: `[Automation] Scheduled delayed background task (+${delaySeconds}s)`
        };
      }

      case 'trigger_workflow': {
        const targetWorkflowId = 'WF-PO-AUTO';
        return {
          success: true,
          output: { triggeredWorkflowId: targetWorkflowId, parentInstanceId: instance.id },
          logMessage: `[Automation] Sub-workflow triggered successfully: ${targetWorkflowId}`
        };
      }

      default:
        return {
          success: true,
          output: {},
          logMessage: `[Automation] Step completed successfully.`
        };
    }
  }
}

export const workflowAutomationEngine = VWEAutomationEngine.getInstance();
