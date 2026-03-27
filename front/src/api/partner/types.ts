export interface SubmitInvoiceReq {
  userId: number;
  /** 销售人员姓名（“你的姓名”） */
  salesName: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  registeredAddress: string;
  taxNo: string;
  bankName: string;
  bankAccount: string;
  invoiceImagePath: string;
}

export interface InvoiceStatusRes {
  id: number;
  userId: number | null;
  /** 销售人员姓名（“你的姓名”） */
  salesName?: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  registeredAddress: string;
  taxNo: string;
  bankName: string;
  bankAccount: string;
  invoiceImagePath: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | null;
  updatedAt: string | null;
}
