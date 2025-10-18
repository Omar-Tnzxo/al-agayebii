'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactFAQProps {
  items?: FAQItem[];
  className?: string;
}

// أسئلة افتراضية
const defaultFAQItems: FAQItem[] = [
  {
    id: '1',
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'نقبل الدفع نقداً عند الاستلام، التحويل البنكي، فودافون كاش، وفيزا/ماستر كارد. جميع المعاملات آمنة ومشفرة.'
  },
  {
    id: '2',
    question: 'كم تستغرق عملية الشحن والتوصيل؟',
    answer: 'يتم التوصيل خلال 1-3 أيام عمل داخل القاهرة والجيزة، و 3-7 أيام للمحافظات الأخرى. نوفر خدمة التتبع لجميع الطلبات.'
  },
  {
    id: '3',
    question: 'هل يمكنني إرجاع أو استبدال المنتج؟',
    answer: 'نعم، يمكنك إرجاع أو استبدال المنتج خلال 14 يوم من تاريخ الاستلام، بشرط أن يكون المنتج في حالته الأصلية مع العبوة.'
  },
  {
    id: '4',
    question: 'كيف يمكنني تتبع طلبي؟',
    answer: 'بمجرد شحن طلبك، ستحصل على رسالة نصية ورقم تتبع. يمكنك استخدام الرقم لتتبع الطلب على موقعنا أو الاتصال بخدمة العملاء.'
  },
  {
    id: '5',
    question: 'هل تقدمون ضمان على المنتجات؟',
    answer: 'نعم، جميع منتجاتنا تأتي مع ضمان من الشركة المصنعة. مدة الضمان تختلف حسب نوع المنتج وتتراوح من 6 شهور إلى 3 سنوات.'
  },
  {
    id: '6',
    question: 'هل يمكنني زيارة المعرض مباشرة؟',
    answer: 'بالطبع! يمكنك زيارة معرضنا في 6 أكتوبر، الجيزة. نرحب بك من السبت إلى الخميس، من 9 صباحاً حتى 9 مساءً. يُفضل الاتصال مسبقاً.'
  }
];

export function ContactFAQ({ items = defaultFAQItems, className = '' }: ContactFAQProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <Card className={`p-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-primary">الأسئلة الشائعة</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="border border-accent/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-right bg-white hover:bg-accent/5 transition-colors"
            >
              <span className="font-semibold text-primary text-lg">{item.question}</span>
              <motion.div
                animate={{ rotate: openItem === item.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {openItem === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-accent/5 border-t border-accent/10">
                    <p className="text-gray-600 leading-relaxed text-base">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-primary/5 rounded-lg text-center">
        <p className="text-gray-600 mb-2">لم تجد إجابة لسؤالك؟</p>
        <p className="text-primary font-semibold">
          تواصل معنا مباشرة وسنكون سعداء لمساعدتك!
        </p>
      </div>
    </Card>
  );
}