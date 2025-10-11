'use client';

import Link from 'next/link';
import { MapPin, ExternalLink } from 'lucide-react';

interface StoreLocation {
  id: string;
  name: string;
  mapUrl: string;
  address: string;
}

interface StoreLocationsProps {
  className?: string;
}

export function StoreLocations({ className = '' }: StoreLocationsProps) {
  // هنا نقوم بتخزين مواقع المحلات، يمكننا استخدام Context أو API لجلب هذه البيانات في تطبيق حقيقي
  const storeLocations: StoreLocation[] = [
    {
      id: 'store1',
      name: 'فرع العجايبي الرئيسي',
      mapUrl: 'https://maps.app.goo.gl/5ZvpXS3Xegu94v9N8',
      address: 'جمهورية مصر العربية، القاهرة'
    },
    {
      id: 'store2',
      name: 'فرع العجايبي الثاني',
      mapUrl: 'https://maps.app.goo.gl/69g5Jxe9hHezkqSi7',
      address: 'جمهورية مصر العربية، الإسكندرية'
    }
  ];
  
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <h3 className="text-lg font-bold mb-2">فروعنا</h3>
      
      {storeLocations.map((store) => (
        <div key={store.id} className="border border-primary/20 rounded-lg p-4 bg-white/80 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-primary">{store.name}</h4>
              <p className="text-sm text-accent/80 mb-2">{store.address}</p>
              <Link 
                href={store.mapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-1 text-primary hover:underline"
              >
                <span>عرض على الخريطة</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}