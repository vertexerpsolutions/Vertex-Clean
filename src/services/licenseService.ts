import { licenseManager } from '../core/license/LicenseManager';
import { LicenseType } from '../core/license/LicenseTypes';

export class LicenseService {
  private static instance: LicenseService;

  private constructor() {}

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  public getDashboardInfo() {
    return licenseManager.getDashboardInfo();
  }

  public switchLicenseType(type: LicenseType) {
    return licenseManager.switchLicenseType(type);
  }

  public activateOnline(key: string, deviceName: string) {
    return licenseManager.activateOnline(key, deviceName);
  }

  public activateOffline(key: string, offlineBlob: string) {
    return licenseManager.activateOffline(key, offlineBlob);
  }

  public getActivationHistory() {
    return licenseManager.getActivationHistory();
  }

  public revokeDevice(deviceId: string) {
    return licenseManager.revokeDevice(deviceId);
  }

  public renewLicense(years: number) {
    return licenseManager.renewLicense(years);
  }

  public getPackages() {
    return licenseManager.getPackages();
  }

  public getReleases() {
    return licenseManager.getReleases();
  }

  public getPurchases() {
    return licenseManager.getPurchases();
  }

  public getSupportTickets() {
    return licenseManager.getSupportTickets();
  }

  public createSupportTicket(subject: string, priority: 'HIGH' | 'CRITICAL' | 'NORMAL') {
    return licenseManager.createSupportTicket(subject, priority);
  }

  public getAnalytics() {
    return licenseManager.getAnalytics();
  }

  public getSecurityAudit() {
    return licenseManager.getSecurityAudit();
  }

  public runAntiCrackValidation() {
    return licenseManager.runAntiCrackValidation();
  }

  public generateDocs() {
    return licenseManager.generateDocs();
  }
}

export const licenseService = LicenseService.getInstance();
