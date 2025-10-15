'use client';

import { useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { formatPrice } from '@/lib/utils/helpers';

interface OrderForExport {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  governorate?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total: number;
  shipping_cost: number;
  total_cost?: number;
  total_profit?: number;
  created_at: string;
}

interface ExportPrintOptionsProps {
  orders: OrderForExport[];
  selectedOrders?: string[];
  onClose?: () => void;
}

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  replacement_requested: 'طلب استبدال',
  replaced: 'تم الاستبدال',
  returned: 'مرتجع',
  cancelled: 'ملغي',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  cash_on_delivery: 'دفع عند الاستلام',
  collected: 'تم التحصيل',
  refund_pending: 'في انتظار الإرجاع',
  refunded: 'تم الإرجاع',
};

export default function ExportPrintOptions({ orders, selectedOrders, onClose }: ExportPrintOptionsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [printFormat, setPrintFormat] = useState<'list' | 'individual' | 'summary'>('list');
  const [includeFields, setIncludeFields] = useState({
    orderNumber: true,
    customerInfo: true,
    address: true,
    status: true,
    paymentInfo: true,
    amounts: true,
    dates: true,
    profit: false
  });

  // تحديد الطلبات المراد تصديرها
  const ordersToExport = selectedOrders && selectedOrders.length > 0
    ? orders.filter(OrderForExport => selectedOrders.includes(OrderForExport.id))
    : orders;

  // تصدير CSV
  const exportToCSV = () => {
    const headers = [];
    if (includeFields.orderNumber) headers.push('رقم الطلب');
    if (includeFields.customerInfo) headers.push('اسم العميل', 'رقم الهاتف');
    if (includeFields.address) headers.push('العنوان', 'المحافظة');
    if (includeFields.status) headers.push('حالة الطلب', 'حالة الدفع');
    if (includeFields.paymentInfo) headers.push('طريقة الدفع');
    if (includeFields.amounts) headers.push('الإجمالي', 'تكلفة الشحن');
    if (includeFields.profit && includeFields.amounts) headers.push('التكلفة', 'الربح');
    if (includeFields.dates) headers.push('تاريخ الإنشاء');

    const csvContent = [
      headers.join(','),
      ...ordersToExport.map(OrderForExport => {
        const row = [];
        if (includeFields.orderNumber) row.push(`"${OrderForExport.order_number}"`);
        if (includeFields.customerInfo) {
          row.push(`"${OrderForExport.customer_name}"`);
          row.push(`"${OrderForExport.customer_phone}"`);
        }
        if (includeFields.address) {
          row.push(`"${OrderForExport.address}"`);
          row.push(`"${OrderForExport.governorate || ''}"`);
        }
        if (includeFields.status) {
          row.push(`"${statusLabels[OrderForExport.status] || OrderForExport.status}"`);
          row.push(`"${paymentStatusLabels[OrderForExport.payment_status] || OrderForExport.payment_status}"`);
        }
        if (includeFields.paymentInfo) row.push(`"${OrderForExport.payment_method}"`);
        if (includeFields.amounts) {
          row.push(OrderForExport.total);
          row.push(OrderForExport.shipping_cost);
        }
        if (includeFields.profit && includeFields.amounts) {
          row.push(OrderForExport.total_cost || 0);
          row.push(OrderForExport.total_profit || 0);
        }
        if (includeFields.dates) row.push(`"${new Date(OrderForExport.created_at).toLocaleDateString('ar-EG')}"`);
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // تصدير Excel (كـ CSV مع metadata)
  const exportToExcel = () => {
    // نفس منطق CSV ولكن مع إضافات Excel-friendly
    exportToCSV(); // مبسط للآن
  };

  // تصدير PDF
  const exportToPDF = () => {
    // إنشاء محتوى HTML للطباعة
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير الطلبات</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            direction: rtl;
            text-align: right;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #333;
            margin: 0;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            border-top: 2px solid #ddd;
            padding-top: 20px;
          }
          .summary-item {
            margin: 10px 0;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الطلبات</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          <p>عدد الطلبات: ${ordersToExport.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              ${includeFields.orderNumber ? '<th>رقم الطلب</th>' : ''}
              ${includeFields.customerInfo ? '<th>اسم العميل</th><th>رقم الهاتف</th>' : ''}
              ${includeFields.address ? '<th>المحافظة</th>' : ''}
              ${includeFields.status ? '<th>حالة الطلب</th><th>حالة الدفع</th>' : ''}
              ${includeFields.amounts ? '<th>الإجمالي</th>' : ''}
              ${includeFields.profit && includeFields.amounts ? '<th>الربح</th>' : ''}
              ${includeFields.dates ? '<th>تاريخ الإنشاء</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${ordersToExport.map(OrderForExport => `
              <tr>
                ${includeFields.orderNumber ? `<td>${OrderForExport.order_number}</td>` : ''}
                ${includeFields.customerInfo ? `
                  <td>${OrderForExport.customer_name}</td>
                  <td>${OrderForExport.customer_phone}</td>
                ` : ''}
                ${includeFields.address ? `<td>${OrderForExport.governorate || '-'}</td>` : ''}
                ${includeFields.status ? `
                  <td>${statusLabels[OrderForExport.status] || OrderForExport.status}</td>
                  <td>${paymentStatusLabels[OrderForExport.payment_status] || OrderForExport.payment_status}</td>
                ` : ''}
                ${includeFields.amounts ? `<td>${formatPrice(OrderForExport.total)}</td>` : ''}
                ${includeFields.profit && includeFields.amounts ? `
                  <td style="color: ${(OrderForExport.total_profit || 0) >= 0 ? 'green' : 'red'}">
                    ${formatPrice(OrderForExport.total_profit || 0)}
                  </td>
                ` : ''}
                ${includeFields.dates ? `<td>${new Date(OrderForExport.created_at).toLocaleDateString('ar-EG')}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <h3>ملخص التقرير:</h3>
          <div class="summary-item">إجمالي عدد الطلبات: ${ordersToExport.length}</div>
          <div class="summary-item">إجمالي المبيعات: ${formatPrice(ordersToExport.reduce((sum, OrderForExport) => sum + OrderForExport.total, 0))}</div>
          ${includeFields.profit ? `
            <div class="summary-item">إجمالي الربح: ${formatPrice(ordersToExport.reduce((sum, OrderForExport) => sum + (OrderForExport.total_profit || 0), 0))}</div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // تحويل لـ PDF عبر الطباعة
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // طباعة قائمة
  const printList = () => {
    exportToPDF(); // نفس منطق PDF
  };

  // طباعة فردية لكل طلب
  const printIndividual = () => {
    ordersToExport.forEach((OrderForExport, index) => {
      setTimeout(() => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;

        const htmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <title>طلب ${OrderForExport.order_number}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 20px;
                direction: rtl;
                text-align: right;
              }
              .invoice-header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .invoice-header h1 {
                color: #007bff;
                margin: 0;
                font-size: 28px;
              }
              .OrderForExport-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
              }
              .info-section {
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
              }
              .info-section h3 {
                margin-top: 0;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
              }
              .info-item {
                margin: 15px 0;
                display: flex;
                justify-content: space-between;
              }
              .info-label {
                font-weight: bold;
                color: #666;
              }
              .info-value {
                color: #333;
              }
              .status-badge {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
              }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-confirmed { background: #d1ecf1; color: #0c5460; }
              .status-shipped { background: #d4edda; color: #155724; }
              .status-delivered { background: #d1ecf1; color: #0c5460; }
              .footer {
                margin-top: 50px;
                text-align: center;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>فاتورة طلب</h1>
              <h2>رقم الطلب: ${OrderForExport.order_number}</h2>
            </div>

            <div class="OrderForExport-info">
              <div class="info-section">
                <h3>معلومات العميل</h3>
                <div class="info-item">
                  <span class="info-label">الاسم:</span>
                  <span class="info-value">${OrderForExport.customer_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">رقم الهاتف:</span>
                  <span class="info-value">${OrderForExport.customer_phone}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">العنوان:</span>
                  <span class="info-value">${OrderForExport.address}</span>
                </div>
                ${OrderForExport.governorate ? `
                <div class="info-item">
                  <span class="info-label">المحافظة:</span>
                  <span class="info-value">${OrderForExport.governorate}</span>
                </div>
                ` : ''}
              </div>

              <div class="info-section">
                <h3>معلومات الطلب</h3>
                <div class="info-item">
                  <span class="info-label">حالة الطلب:</span>
                  <span class="status-badge status-${OrderForExport.status}">${statusLabels[OrderForExport.status] || OrderForExport.status}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">حالة الدفع:</span>
                  <span class="status-badge">${paymentStatusLabels[OrderForExport.payment_status] || OrderForExport.payment_status}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">طريقة الدفع:</span>
                  <span class="info-value">${OrderForExport.payment_method}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">تاريخ الطلب:</span>
                  <span class="info-value">${new Date(OrderForExport.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>تفاصيل المبالغ</h3>
              <div class="info-item">
                <span class="info-label">إجمالي الطلب:</span>
                <span class="info-value">${formatPrice(OrderForExport.total)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">تكلفة الشحن:</span>
                <span class="info-value">${formatPrice(OrderForExport.shipping_cost)}</span>
              </div>
              <div class="info-item" style="border-top: 2px solid #007bff; padding-top: 15px; margin-top: 15px; font-size: 18px; font-weight: bold;">
                <span class="info-label">المجموع الإجمالي:</span>
                <span class="info-value" style="color: #007bff;">${formatPrice(OrderForExport.total)}</span>
              </div>
            </div>

            <div class="footer">
              <p>شكراً لكم لاختياركم خدماتنا</p>
              <p>تم إنشاء هذه الفاتورة في: ${new Date().toLocaleString('en-US')}</p>
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }, index * 500); // تأخير بين الطلبات
    });
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
    onClose?.();
  };

  const handlePrint = () => {
    switch (printFormat) {
      case 'list':
        printList();
        break;
      case 'individual':
        printIndividual();
        break;
      case 'summary':
        printList(); // مؤقت
        break;
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 text-white rounded-xl">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">تصدير وطباعة الطلبات</h2>
                <p className="text-gray-600">
                  {selectedOrders && selectedOrders.length > 0
                    ? `${selectedOrders.length} طلب محدد`
                    : `${orders.length} طلب إجمالي`
                  }
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* التصدير */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">تصدير البيانات</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">تنسيق التصدير</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={cn(
                        'flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                        exportFormat === 'csv'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <FileText className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">CSV</span>
                    </button>

                    <button
                      onClick={() => setExportFormat('excel')}
                      className={cn(
                        'flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                        exportFormat === 'excel'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <FileSpreadsheet className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Excel</span>
                    </button>

                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={cn(
                        'flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                        exportFormat === 'pdf'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <File className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">PDF</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  تصدير البيانات
                </button>
              </div>

              {/* الطباعة */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Printer className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">طباعة الطلبات</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">نوع الطباعة</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="printFormat"
                        value="list"
                        checked={printFormat === 'list'}
                        onChange={() => setPrintFormat('list')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">قائمة شاملة</div>
                        <div className="text-sm text-gray-500">طباعة جميع الطلبات في جدول واحد</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="printFormat"
                        value="individual"
                        checked={printFormat === 'individual'}
                        onChange={() => setPrintFormat('individual')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">فواتير فردية</div>
                        <div className="text-sm text-gray-500">طباعة فاتورة منفصلة لكل طلب</div>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  طباعة الآن
                </button>
              </div>
            </div>

            {/* خيارات الحقول */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-4">الحقول المراد تضمينها</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({
                  orderNumber: 'رقم الطلب',
                  customerInfo: 'معلومات العميل',
                  address: 'العنوان',
                  status: 'الحالات',
                  paymentInfo: 'معلومات الدفع',
                  amounts: 'المبالغ',
                  dates: 'التواريخ',
                  profit: 'الأرباح'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFields[key as keyof typeof includeFields]}
                      onChange={(e) => setIncludeFields({
                        ...includeFields,
                        [key]: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
