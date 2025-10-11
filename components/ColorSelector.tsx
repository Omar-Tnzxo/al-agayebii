'use client';

import { useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';

export interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  isAvailable: boolean;
}

interface ColorSelectorProps {
  onColorsChanged: (colors: ProductColor[]) => void;
  currentColors?: ProductColor[];
  className?: string;
  isAdmin?: boolean;
}

const PREDEFINED_COLORS = [
  { name: 'أحمر', hexCode: '#EF4444' },
  { name: 'أزرق', hexCode: '#3B82F6' },
  { name: 'أخضر', hexCode: '#10B981' },
  { name: 'أصفر', hexCode: '#F59E0B' },
  { name: 'بنفسجي', hexCode: '#8B5CF6' },
  { name: 'وردي', hexCode: '#EC4899' },
  { name: 'أسود', hexCode: '#111827' },
  { name: 'أبيض', hexCode: '#FFFFFF' },
  { name: 'رمادي', hexCode: '#6B7280' },
  { name: 'بني', hexCode: '#92400E' },
  { name: 'برتقالي', hexCode: '#EA580C' },
  { name: 'زيتي', hexCode: '#84CC16' },
];

export default function ColorSelector({ 
  onColorsChanged, 
  currentColors = [], 
  className = '',
  isAdmin = false 
}: ColorSelectorProps) {
  const [colors, setColors] = useState<ProductColor[]>(currentColors);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', hexCode: '#000000' });
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  const addColor = (colorData: { name: string; hexCode: string }) => {
    const newColorObj: ProductColor = {
      id: Date.now().toString(),
      name: colorData.name,
      hexCode: colorData.hexCode,
      isAvailable: true
    };
    
    const updatedColors = [...colors, newColorObj];
    setColors(updatedColors);
    onColorsChanged(updatedColors);
    setNewColor({ name: '', hexCode: '#000000' });
    setShowColorPicker(false);
  };

  const removeColor = (colorId: string) => {
    const updatedColors = colors.filter(color => color.id !== colorId);
    setColors(updatedColors);
    onColorsChanged(updatedColors);
  };

  const toggleColorAvailability = (colorId: string) => {
    const updatedColors = colors.map(color =>
      color.id === colorId ? { ...color, isAvailable: !color.isAvailable } : color
    );
    setColors(updatedColors);
    onColorsChanged(updatedColors);
  };

  const selectColor = (colorId: string) => {
    setSelectedColorId(colorId);
  };

  const addPredefinedColor = (predefinedColor: { name: string; hexCode: string }) => {
    // التحقق من عدم وجود اللون مسبقاً
    const colorExists = colors.some(color => color.hexCode === predefinedColor.hexCode);
    if (!colorExists) {
      addColor(predefinedColor);
    }
  };



  if (isAdmin) {
    // واجهة الأدمن - إدارة الألوان
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            الألوان المتاحة ({colors.length})
          </label>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            إضافة لون
          </button>
        </div>

        {/* عرض الألوان الحالية */}
        {colors.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colors.map((color) => (
              <div
                key={color.id}
                className={`
                  relative p-3 border rounded-lg cursor-pointer transition-all
                  ${color.isAvailable ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${color.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                      {color.name}
                    </p>
                    <p className="text-xs text-gray-500">{color.hexCode}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={color.isAvailable}
                      onChange={() => toggleColorAvailability(color.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600">متاح</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => removeColor(color.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="حذف اللون"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* إضافة لون جديد */}
        {showColorPicker && (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">إضافة لون جديد</h4>
            
            {/* الألوان المحددة مسبقاً */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">اختر من الألوان الشائعة:</p>
              <div className="grid grid-cols-6 gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color.hexCode}
                    type="button"
                    onClick={() => addPredefinedColor(color)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color.hexCode }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* إضافة لون مخصص */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    اسم اللون
                  </label>
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: أحمر غامق"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newColor.name.trim() && newColor.hexCode) {
                          addColor(newColor);
                        }
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    كود اللون
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor(prev => ({ ...prev, hexCode: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor(prev => ({ ...prev, hexCode: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newColor.name.trim() && newColor.hexCode) {
                            addColor(newColor);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newColor.name.trim() && newColor.hexCode) {
                      addColor(newColor);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  إضافة اللون
                </button>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* رسالة إرشادية */}
        {colors.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 text-sm">
                لا توجد ألوان محددة لهذا المنتج. اضغط "إضافة لون" لبدء إضافة الألوان المتاحة.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // واجهة العميل - اختيار لون
    const availableColors = colors.filter(color => color.isAvailable);
    
    if (availableColors.length === 0) {
      return null;
    }

    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">
          اختر اللون:
        </label>
        
        <div className="flex flex-wrap gap-3">
          {availableColors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => selectColor(color.id)}
              className={`
                flex items-center gap-2 px-3 py-2 border rounded-lg transition-all
                ${selectedColorId === color.id 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }
              `}
            >
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hexCode }}
              />
              <span className="text-sm font-medium text-gray-900">
                {color.name}
              </span>
            </button>
          ))}
        </div>
        
        {selectedColorId && (
          <p className="text-xs text-gray-600">
            تم اختيار: {availableColors.find(c => c.id === selectedColorId)?.name}
          </p>
        )}
      </div>
    );
  }
} 