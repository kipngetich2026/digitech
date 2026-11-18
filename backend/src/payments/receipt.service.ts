import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';

import { COMPANY } from '../common/company';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Invoice, InvoiceDocument } from '../invoices/schemas/invoice.schema';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';

export interface ReceiptPdf {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class ReceiptService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async generateForPayment(
    paymentId: string,
    user: {
      sub: string;
      email: string;
      role: string;
      branchId: string;
    },
  ): Promise<ReceiptPdf> {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw new NotFoundException('Invalid payment ID');
    }

    const filter: Record<string, unknown> = {
      _id: paymentId,
    };

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      filter.branchId = new Types.ObjectId(user.branchId);
    }

    const payment = await this.paymentModel
      .findOne(filter)
      .populate(
        'invoiceId',
        'invoiceNumber total amountPaid balanceDue paymentStatus items subtotal discount tax issueDate',
      )
      .populate('customerId', 'customerNumber firstName lastName phone email')
      .populate('createdBy', 'firstName lastName email')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const invoiceId = (payment.invoiceId as any)?._id ?? payment.invoiceId;

    const invoice = invoiceId
      ? await this.invoiceModel.findById(invoiceId).lean().exec()
      : null;

    const branch = await this.branchModel
      .findById(payment.branchId)
      .lean()
      .exec();

    const buffer = await this.buildPdf(payment, invoice, branch);
    const filename = `${payment.paymentNumber}-receipt.pdf`;

    return { buffer, filename };
  }

  private async buildPdf(
    payment: PaymentDocument,
    invoice: any | null,
    branch: any | null,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Receipt ${payment.paymentNumber}`,
        Author: COMPANY.name,
        Subject: 'Payment receipt',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.drawHeader(doc, branch);
    this.drawReceiptMeta(doc, payment);
    this.drawParties(doc, payment, invoice);
    this.drawPaymentDetails(doc, payment);
    this.drawInvoiceSummary(doc, payment, invoice);
    this.drawFooter(doc, payment);

    doc.end();

    return done;
  }

  private drawHeader(doc: PDFKit.PDFDocument, branch: any | null): void {
    const logoPath = this.resolveLogoPath();

    if (logoPath) {
      try {
        doc.image(logoPath, doc.page.margins.left, 48, {
          width: 52,
          height: 52,
        });
      } catch {
        // ignore broken logo — text-only header still renders
      }
    }

    const textX = logoPath ? doc.page.margins.left + 64 : doc.page.margins.left;

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1e1b4b')
      .text(COMPANY.name, textX, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(COMPANY.tagline, textX, 74);

    const contactLines = [
      branch?.address || COMPANY.address,
      [COMPANY.phone, COMPANY.email].filter(Boolean).join('  ·  '),
    ].filter(Boolean);

    contactLines.forEach((line, i) => {
      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .text(line, textX, 90 + i * 12);
    });

    const top = 48;
    const bottom = 130;
    doc
      .moveTo(doc.page.margins.left, bottom)
      .lineTo(doc.page.width - doc.page.margins.right, bottom)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#4f46e5')
      .text('PAYMENT RECEIPT', doc.page.margins.left, top + 96, {
        align: 'left',
      });
  }

  private drawReceiptMeta(
    doc: PDFKit.PDFDocument,
    payment: PaymentDocument,
  ): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const y = 170;

    const rows: Array<[string, string]> = [
      ['Receipt #', payment.paymentNumber],
      [
        'Date',
        this.formatDate(
          (payment as unknown as { createdAt?: Date | string }).createdAt,
        ),
      ],
      ['Status', payment.status],
    ];

    rows.forEach(([label, value], i) => {
      const rowY = y + i * 16;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(label, left, rowY, { width: 90 });
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(String(value), left + 100, rowY);
    });

    doc
      .moveTo(left, y + 56)
      .lineTo(right, y + 56)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();
  }

  private drawParties(
    doc: PDFKit.PDFDocument,
    payment: PaymentDocument,
    invoice: any | null,
  ): void {
    const left = doc.page.margins.left;
    const mid = doc.page.width / 2;
    const y = 250;

    const customer = payment.customerId as any;
    const invoiceRef = payment.invoiceId as any;
    const createdBy = payment.createdBy as any;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text('BILLED TO', left, y);
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text('REFERENCE', mid, y);

    const customerName =
      customer && typeof customer === 'object'
        ? `${customer.firstName} ${customer.lastName}`
        : 'Walk-in customer';
    const customerMeta =
      customer && typeof customer === 'object'
        ? [customer.customerNumber, customer.phone, customer.email]
            .filter(Boolean)
            .join(' · ')
        : '';

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(customerName, left, y + 16, { width: mid - left - 16 });
    if (customerMeta) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(customerMeta, left, y + 32, { width: mid - left - 16 });
    }

    const invoiceNumber =
      invoiceRef && typeof invoiceRef === 'object'
        ? invoiceRef.invoiceNumber
        : invoice?.invoiceNumber || '—';

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(invoiceNumber, mid, y + 16);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(
        [
          `Issued by ${createdBy && typeof createdBy === 'object' ? `${createdBy.firstName} ${createdBy.lastName}` : 'System'}`,
          payment.reference ? `Ref ${payment.reference}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        mid,
        y + 32,
        { width: doc.page.width - doc.page.margins.right - mid },
      );
  }

  private drawPaymentDetails(
    doc: PDFKit.PDFDocument,
    payment: PaymentDocument,
  ): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const y = 320;

    doc
      .roundedRect(left, y, right - left, 64, 8)
      .fillColor('#eef2ff')
      .fill();

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#6366f1')
      .text('AMOUNT PAID', left + 16, y + 14);

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#312e81')
      .text(this.formatKes(payment.amount), left + 16, y + 30);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(payment.method.replace('_', ' '), right - 140, y + 22, {
        width: 124,
        align: 'right',
      });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Method', right - 140, y + 40, {
        width: 124,
        align: 'right',
      });
  }

  private drawInvoiceSummary(
    doc: PDFKit.PDFDocument,
    payment: PaymentDocument,
    invoice: any | null,
  ): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    let y = 410;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Invoice summary', left, y);
    y += 18;

    const items: Array<{ label: string; value: string; bold?: boolean }> = [];

    if (invoice?.items?.length) {
      for (const item of invoice.items) {
        items.push({
          label: `${item.itemName}  ×${item.quantity}`,
          value: this.formatKes(item.subtotal),
        });
      }
      items.push({ label: '', value: '', bold: true });
    }

    if (invoice) {
      items.push(
        { label: 'Subtotal', value: this.formatKes(invoice.subtotal ?? 0) },
        {
          label: 'Discount',
          value: `-${this.formatKes(invoice.discount ?? 0)}`,
        },
        { label: 'Tax', value: `+${this.formatKes(invoice.tax ?? 0)}` },
        {
          label: 'Invoice total',
          value: this.formatKes(invoice.total ?? 0),
          bold: true,
        },
        {
          label: 'Paid to date',
          value: this.formatKes(invoice.amountPaid ?? 0),
        },
        {
          label: 'Balance due',
          value: this.formatKes(invoice.balanceDue ?? 0),
          bold: true,
        },
      );
    } else {
      items.push({
        label: 'Payment amount',
        value: this.formatKes(payment.amount),
        bold: true,
      });
    }

    for (const row of items) {
      if (!row.label && !row.value) {
        y += 8;
        continue;
      }
      const font = row.bold ? 'Helvetica-Bold' : 'Helvetica';
      const color = row.bold ? '#0f172a' : '#475569';
      doc
        .fontSize(10)
        .font(font)
        .fillColor(color)
        .text(row.label, left, y, {
          width: (right - left) * 0.6,
        });
      doc
        .fontSize(10)
        .font(font)
        .fillColor(color)
        .text(row.value, left + (right - left) * 0.6, y, {
          width: (right - left) * 0.4,
          align: 'right',
        });
      y += 16;
    }
  }

  private drawFooter(doc: PDFKit.PDFDocument, payment: PaymentDocument): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const baseY = doc.page.height - 90;

    doc
      .moveTo(left, baseY)
      .lineTo(right, baseY)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        `Thank you for your payment. This receipt was generated automatically for ${payment.paymentNumber}.`,
        left,
        baseY + 14,
        { width: right - left, align: 'center' },
      );

    doc
      .fontSize(8)
      .fillColor('#cbd5e1')
      .text(
        `${COMPANY.name} · ${COMPANY.tagline} · ${COMPANY.email}`,
        left,
        baseY + 32,
        { width: right - left, align: 'center' },
      );
  }

  private resolveLogoPath(): string | null {
    const candidates = [
      join(process.cwd(), 'src', 'assets', 'logo.png'),
      join(process.cwd(), 'dist', 'assets', 'logo.png'),
      join(__dirname, '..', 'assets', 'logo.png'),
      join(__dirname, '..', '..', 'src', 'assets', 'logo.png'),
      join(__dirname, '..', '..', 'assets', 'logo.png'),
    ];

    for (const path of candidates) {
      if (existsSync(path)) return path;
    }

    return null;
  }

  private formatKes(amount: number): string {
    const n = Number(amount) || 0;
    return `KES ${n.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatDate(value: Date | string | undefined): string {
    if (!value) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
