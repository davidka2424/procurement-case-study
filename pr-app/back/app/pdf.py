"""Quick-and-dirty PDF export for a single purchase request."""
from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors

from .models import PurchaseRequest


def render_pr_pdf(pr: PurchaseRequest) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Purchase Request {pr.request_code}",
    )
    styles = getSampleStyleSheet()
    body = []
    body.append(Paragraph(f"<b>Purchase Request {pr.request_code}</b>", styles["Title"]))
    body.append(Spacer(1, 12))

    data = [
        ["Request name", pr.request_name],
        ["Requested by", pr.request_author],
        ["Supplier", pr.supplier_name],
        ["Supplier email", pr.supplier_email],
        ["Status", pr.request_approval_status],
        ["Created", pr.created_at.strftime("%Y-%m-%d %H:%M")],
    ]
    table = Table(data, colWidths=[5 * cm, 11 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    body.append(table)
    body.append(Spacer(1, 18))
    body.append(Paragraph("<b>Details</b>", styles["Heading3"]))
    body.append(Paragraph(pr.request_details.replace("\n", "<br/>"), styles["BodyText"]))

    doc.build(body)
    return buffer.getvalue()
