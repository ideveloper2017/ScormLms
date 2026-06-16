/**
 * Usage Examples for Schedule Hooks
 * 
 * This file demonstrates how to use the schedule hooks in React components.
 * These are example components showing typical usage patterns.
 */

import React from 'react';
import {
  useSchedule,
  useTodaySchedule,
  useWeekSchedule,
  useUpcomingClasses,
  useScheduleByWeek,
  useNextClass,
} from './useSchedule';

/**
 * Example 1: Display complete schedule with filters
 */
export function FullScheduleExample() {
  const { data: schedule, isLoading, error } = useSchedule({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  });

  if (isLoading) {
    return <div>Jadval yuklanmoqda...</div>;
  }

  if (error) {
    return <div>Xatolik: {error.message}</div>;
  }

  return (
    <div>
      <h2>To'liq jadval</h2>
      <div className="grid gap-4">
        {schedule?.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="font-bold">{item.courseName}</h3>
            <p>O'qituvchi: {item.instructor}</p>
            <p>Xona: {item.room}</p>
            <p>
              Vaqt: {item.startTime} - {item.endTime}
            </p>
            {item.isOnline && (
              <span className="text-blue-600">Online</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 2: Display today's schedule
 */
export function TodayScheduleExample() {
  const { data: todayClasses, isLoading } = useTodaySchedule();

  if (isLoading) {
    return <div>Bugungi darslar yuklanmoqda...</div>;
  }

  return (
    <div>
      <h2>Bugungi darslar</h2>
      {todayClasses?.length === 0 ? (
        <p>Bugun darslar yo'q</p>
      ) : (
        <ul>
          {todayClasses?.map((item) => (
            <li key={item.id}>
              <strong>{item.courseName}</strong> - {item.startTime}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Example 3: Display this week's schedule
 */
export function WeekScheduleExample() {
  const { data: weekSchedule, isLoading } = useWeekSchedule();

  if (isLoading) {
    return <div>Haftalik jadval yuklanmoqda...</div>;
  }

  // Group by day of week
  const groupedByDay = weekSchedule?.reduce((acc, item) => {
    const day = item.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, typeof weekSchedule>);

  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

  return (
    <div>
      <h2>Bu hafta jadvali</h2>
      {Object.entries(groupedByDay || {}).map(([day, items]) => (
        <div key={day} className="mb-4">
          <h3 className="font-bold text-lg">{dayNames[Number(day)]}</h3>
          <div className="space-y-2">
            {items?.map((item) => (
              <div key={item.id} className="pl-4 border-l-2 border-blue-500">
                <p className="font-semibold">{item.courseName}</p>
                <p className="text-sm text-gray-600">
                  {item.startTime} - {item.endTime} | {item.room}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Display upcoming classes
 */
export function UpcomingClassesExample() {
  const { data: upcomingClasses, isLoading, error } = useUpcomingClasses();

  if (isLoading) {
    return <div>Keyingi darslar yuklanmoqda...</div>;
  }

  if (error) {
    return <div>Xatolik yuz berdi</div>;
  }

  return (
    <div>
      <h2>Keyingi darslar</h2>
      {upcomingClasses?.length === 0 ? (
        <p>Keyingi darslar yo'q</p>
      ) : (
        <div className="space-y-2">
          {upcomingClasses?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-semibold">{item.courseName}</p>
                <p className="text-sm text-gray-600">
                  {item.instructor} - {item.room}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.startTime}</p>
                {item.isOnline && item.meetingLink && (
                  <a
                    href={item.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Qo'shilish
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Display specific week schedule
 */
export function SpecificWeekExample() {
  const [selectedWeek, setSelectedWeek] = React.useState(10);
  const { data: weekSchedule, isLoading } = useScheduleByWeek(selectedWeek);

  if (isLoading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="week-select" className="mr-2">
          Haftani tanlang:
        </label>
        <select
          id="week-select"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
            <option key={week} value={week}>
              Hafta {week}
            </option>
          ))}
        </select>
      </div>

      {weekSchedule && (
        <div>
          <h3 className="font-bold text-lg mb-2">
            Hafta {weekSchedule.weekNumber}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {weekSchedule.startDate.toLocaleDateString()} -{' '}
            {weekSchedule.endDate.toLocaleDateString()}
          </p>
          <div className="grid gap-2">
            {weekSchedule.items.map((item) => (
              <div key={item.id} className="border rounded p-3">
                <p className="font-semibold">{item.courseName}</p>
                <p className="text-sm">
                  {item.instructor} | {item.room}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Display next upcoming class
 */
export function NextClassWidget() {
  const { data: nextClass, isLoading } = useNextClass();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!nextClass) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded">
        <p className="text-gray-600">Keyingi dars yo'q</p>
      </div>
    );
  }

  return (
    <div className="border-l-4 border-blue-500 p-4 bg-white shadow-sm rounded">
      <h4 className="text-sm text-gray-600 mb-2">Keyingi dars</h4>
      <p className="font-bold text-lg mb-1">{nextClass.courseName}</p>
      <p className="text-sm text-gray-700 mb-1">
        O'qituvchi: {nextClass.instructor}
      </p>
      <p className="text-sm text-gray-700 mb-1">Xona: {nextClass.room}</p>
      <p className="text-sm font-medium text-blue-600">
        {nextClass.startTime} - {nextClass.endTime}
      </p>
      {nextClass.isOnline && nextClass.meetingLink && (
        <a
          href={nextClass.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Online darsga qo'shilish
        </a>
      )}
    </div>
  );
}

/**
 * Example 7: Dashboard widget combining multiple hooks
 */
export function ScheduleDashboardWidget() {
  const { data: nextClass } = useNextClass();
  const { data: todayClasses } = useTodaySchedule();
  const { data: upcomingClasses } = useUpcomingClasses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Next Class Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Keyingi dars</h3>
        {nextClass ? (
          <div>
            <p className="font-semibold">{nextClass.courseName}</p>
            <p className="text-sm text-gray-600">
              {nextClass.startTime} | {nextClass.room}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Keyingi dars yo'q</p>
        )}
      </div>

      {/* Today's Classes Count */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Bugungi darslar</h3>
        <p className="text-3xl font-bold text-blue-600">
          {todayClasses?.length || 0}
        </p>
        <p className="text-sm text-gray-600">ta dars</p>
      </div>

      {/* Upcoming Classes Count */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Keyingi darslar</h3>
        <p className="text-3xl font-bold text-green-600">
          {upcomingClasses?.length || 0}
        </p>
        <p className="text-sm text-gray-600">ta dars</p>
      </div>
    </div>
  );
}
