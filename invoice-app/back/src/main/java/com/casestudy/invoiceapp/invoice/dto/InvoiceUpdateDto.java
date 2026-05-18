package com.casestudy.invoiceapp.invoice.dto;

import java.math.BigDecimal;

/**
 * PUT /invoice/{id} body. Every field is optional — only the ones the client
 * sends get applied. No file upload here; use POST /invoice/{id}/attachment
 * (or re-POST a new invoice) to replace the PDF.
 */
public class InvoiceUpdateDto {
    public String invoiceNumber;
    public String supplier;
    public String purchaseRequestNumber;
    public BigDecimal invoiceSum;
    public BigDecimal invoiceSumPaid;
    public String invoiceStatus;
}
