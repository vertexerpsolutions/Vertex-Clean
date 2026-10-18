import { BusinessRule, BusinessRuleCondition, WorkflowInstance } from './WorkflowTypes';

export class WorkflowRuleEngine {
  private static instance: WorkflowRuleEngine;
  private rules = new Map<string, BusinessRule>();

  private constructor() {
    this.seedDefaultRules();
  }

  public static getInstance(): WorkflowRuleEngine {
    if (!WorkflowRuleEngine.instance) {
      WorkflowRuleEngine.instance = new WorkflowRuleEngine();
    }
    return WorkflowRuleEngine.instance;
  }

  public registerRule(rule: BusinessRule): void {
    this.rules.set(rule.id, rule);
  }

  public getRules(): BusinessRule[] {
    return Array.from(this.rules.values());
  }

  public evaluateRule(ruleId: string, contextData: Record<string, any>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.isActive) return false;

    if (rule.logicOperator === 'AND') {
      return rule.conditions.every(c => this.evaluateCondition(c, contextData));
    } else {
      return rule.conditions.some(c => this.evaluateCondition(c, contextData));
    }
  }

  public evaluateInstance(instance: WorkflowInstance, condition: {
    field: string;
    operator: string;
    value: any;
  }): boolean {
    const contextData = {
      ...instance.contextData,
      company: instance.company,
      branch: instance.branch,
      department: instance.department,
      user: instance.initiatedBy,
      priority: instance.priority,
      status: instance.status,
      date: instance.startedAt
    };

    return this.evaluateCondition(
      { id: 'eval-tmp', field: condition.field, operator: condition.operator as any, value: condition.value },
      contextData
    );
  }

  private evaluateCondition(condition: BusinessRuleCondition, data: Record<string, any>): boolean {
    const fieldValue = data[condition.field];
    const targetValue = condition.value;

    if (fieldValue === undefined || fieldValue === null) return false;

    switch (condition.operator) {
      case '==':
        return String(fieldValue).toLowerCase() === String(targetValue).toLowerCase();
      case '!=':
        return String(fieldValue).toLowerCase() !== String(targetValue).toLowerCase();
      case '>':
        return Number(fieldValue) > Number(targetValue);
      case '>=':
        return Number(fieldValue) >= Number(targetValue);
      case '<':
        return Number(fieldValue) < Number(targetValue);
      case '<=':
        return Number(fieldValue) <= Number(targetValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
      case 'in':
        if (Array.isArray(targetValue)) {
          return targetValue.map(v => String(v).toLowerCase()).includes(String(fieldValue).toLowerCase());
        }
        return false;
      default:
        return false;
    }
  }

  private seedDefaultRules(): void {
    const defaultRules: BusinessRule[] = [
      {
        id: 'BR-RULE-01',
        name: 'High Amount Purchase Approval Threshold',
        description: 'Requires Multi-Level VP Approval if PO amount exceeds $10,000.00',
        category: 'PROCUREMENT',
        logicOperator: 'AND',
        conditions: [
          { id: 'c1', field: 'amount', operator: '>=', value: 10000 },
          { id: 'c2', field: 'company', operator: '==', value: 'Vertex Global Enterprises Corp' }
        ],
        isActive: true
      },
      {
        id: 'BR-RULE-02',
        name: 'New York Branch High Priority Override',
        description: 'Escalates IT infrastructure requests originating from HQ-NY branch',
        category: 'IT_OPS',
        logicOperator: 'AND',
        conditions: [
          { id: 'c1', field: 'branch', operator: '==', value: 'HQ-NY' },
          { id: 'c2', field: 'priority', operator: '==', value: 'HIGH' }
        ],
        isActive: true
      },
      {
        id: 'BR-RULE-03',
        name: 'Executive Expense Voucher Auto-Escalation',
        description: 'Routes finance vouchers with docType = EXPENSE_VOUCHER for Financial Controller review',
        category: 'FINANCE',
        logicOperator: 'AND',
        conditions: [
          { id: 'c1', field: 'docType', operator: '==', value: 'EXPENSE_VOUCHER' },
          { id: 'c2', field: 'amount', operator: '>', value: 5000 }
        ],
        isActive: true
      }
    ];

    defaultRules.forEach(r => this.rules.set(r.id, r));
  }
}

export const workflowRuleEngine = WorkflowRuleEngine.getInstance();
