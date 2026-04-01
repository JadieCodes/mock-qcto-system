import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  XCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export interface AvailabilitySlot {
  id: string;
  userId: string;
  userName: string;
  userRole: 'qp' | 'verifier';
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'unavailable';
  notes?: string;
}

interface ScheduleManagerProps {
  userId: string;
  userName: string;
  userRole: 'qp' | 'verifier';
  onAvailabilityUpdate?: (slots: AvailabilitySlot[]) => void;
}

export default function ScheduleManager({ 
  userId, 
  userName, 
  userRole,
  onAvailabilityUpdate 
}: ScheduleManagerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

  useEffect(() => {
    loadAvailability();
  }, [userId]);

  const loadAvailability = () => {
    const key = `availability_${userRole}_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setAvailabilitySlots(JSON.parse(saved));
    }
  };

  const saveAvailability = (slots: AvailabilitySlot[]) => {
    const key = `availability_${userRole}_${userId}`;
    localStorage.setItem(key, JSON.stringify(slots));
    setAvailabilitySlots(slots);
    
    // Also save to a global collection for the accreditation dashboard
    const allKey = 'all_availability_slots';
    const allSaved = localStorage.getItem(allKey);
    let allSlots: AvailabilitySlot[] = allSaved ? JSON.parse(allSaved) : [];
    
    // Remove old slots for this user
    allSlots = allSlots.filter(s => s.userId !== userId);
    // Add new slots
    allSlots = [...allSlots, ...slots];
    localStorage.setItem(allKey, JSON.stringify(allSlots));
    
    if (onAvailabilityUpdate) {
      onAvailabilityUpdate(slots);
    }
  };

  const addAvailabilitySlot = () => {
    if (!selectedDate) return;

    const newSlot: AvailabilitySlot = {
      id: `slot-${Date.now()}`,
      userId,
      userName,
      userRole,
      date: selectedDate,
      startTime,
      endTime,
      status: 'available',
      notes: notes || undefined,
    };

    const updatedSlots = [...availabilitySlots, newSlot];
    saveAvailability(updatedSlots);
    
    setShowAddSlot(false);
    setSelectedDate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setNotes('');
  };

  const removeSlot = (slotId: string) => {
    const updatedSlots = availabilitySlots.filter(s => s.id !== slotId);
    saveAvailability(updatedSlots);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return { daysInMonth, startingDay };
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date(currentMonth);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilitySlots.filter(slot => slot.date === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(currentMonth.getDate() + 7);
    setCurrentMonth(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(currentMonth.getDate() - 7);
    setCurrentMonth(newDate);
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dateStr = formatDate(day);
            const daySlots = getSlotsForDate(day);
            const isToday = formatDate(new Date()) === dateStr;
            
            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className={`p-2 text-center font-medium ${isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
                  <div className="text-xs">{day.toLocaleDateString('default', { weekday: 'short' })}</div>
                  <div className="text-lg">{day.getDate()}</div>
                </div>
                <div className="p-2 min-h-[120px]">
                  {daySlots.length > 0 ? (
                    <div className="space-y-1">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="text-xs p-1 bg-green-100 text-green-700 rounded flex justify-between items-center">
                          <span>{slot.startTime} - {slot.endTime}</span>
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setShowAddSlot(true);
                      }}
                      className="w-full h-full min-h-[80px] flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded border-2 border-dashed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50 min-h-[100px]"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatDate(date);
      const daySlots = getSlotsForDate(date);
      const isToday = formatDate(new Date()) === dateStr;
      
      days.push(
        <div key={day} className={`p-2 border min-h-[100px] ${isToday ? 'bg-blue-50' : ''}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
            <button
              onClick={() => {
                setSelectedDate(dateStr);
                setShowAddSlot(true);
              }}
              className="text-gray-400 hover:text-blue-500"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {daySlots.map(slot => (
            <div key={slot.id} className="text-xs p-1 mb-1 bg-green-100 text-green-700 rounded flex justify-between items-center">
              <span>{slot.startTime} - {slot.endTime}</span>
              <button
                onClick={() => removeSlot(slot.id)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-800">My Availability Schedule</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={viewMode === 'week' ? prevWeek : prevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">
              {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={viewMode === 'week' ? nextWeek : nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {viewMode === 'week' ? (
          renderWeekView()
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add Availability Slot</h3>
              <button
                onClick={() => setShowAddSlot(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={formatDate(new Date())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Only available in the morning, prefer certain locations, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addAvailabilitySlot}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-500 rounded mr-1"></div>
              <span className="text-gray-600">Available: {availabilitySlots.filter(s => s.status === 'available').length} slots</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded mr-1"></div>
              <span className="text-gray-600">Booked: {availabilitySlots.filter(s => s.status === 'booked').length} slots</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddSlot(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Availability
          </button>
        </div>
      </div>
    </div>
  );
}