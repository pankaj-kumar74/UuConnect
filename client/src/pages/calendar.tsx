import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from "date-fns";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements"],
  });

  // Filter announcements that have event dates
  const events = announcements?.filter((announcement: any) => announcement.eventDate) || [];

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event: any) => 
      event.eventDate && isSameDay(new Date(event.eventDate), date)
    );
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days from previous and next months
  const startDay = monthStart.getDay(); // 0 = Sunday
  const paddingStart = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const totalCells = 42; // 6 rows × 7 days
  const usedCells = paddingStart.length + calendarDays.length;
  const paddingEnd = Array.from({ length: totalCells - usedCells }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + (i + 1));
    return date;
  });

  const allDays = [...paddingStart, ...calendarDays, ...paddingEnd];

  const getCategoryColor = (category: string) => {
    const colors = {
      Academic: "bg-blue-500",
      Events: "bg-green-500",
      Admissions: "bg-purple-500",
      Scholarships: "bg-yellow-500",
      Examinations: "bg-red-500",
      General: "bg-gray-500",
      Sports: "bg-orange-500",
      Cultural: "bg-pink-500",
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
    }
  };

  const upcomingEvents = events
    .filter((event: any) => new Date(event.eventDate) >= new Date())
    .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <span>Campus Events Calendar</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Stay updated with all campus events, academic deadlines, and important dates
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {format(currentDate, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {allDays.map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] p-1 border border-gray-200 dark:border-gray-700 cursor-pointer
                          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${!isCurrentMonth ? 'opacity-30' : ''}
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}
                          ${isToday(day) ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : ''}
                        `}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className={`
                          text-sm font-medium mb-1
                          ${isToday(day) ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-900 dark:text-gray-100'}
                        `}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event: any) => (
                            <div
                              key={event.id}
                              className={`
                                text-xs px-1 py-0.5 rounded text-white truncate
                                ${getCategoryColor(event.category)}
                              `}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Events */}
            {selectedDate && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    Events on {format(selectedDate, "PPPP")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-4">
                      {getEventsForDate(selectedDate).map((event: any) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {event.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                {event.content}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(event.eventDate), "p")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge className={`${getCategoryColor(event.category)} text-white`}>
                              {event.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No events scheduled for this date
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="border-l-4 border-primary pl-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-r"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {event.title}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(event.eventDate), "MMM d, p")}
                          </span>
                        </div>
                        <Badge size="sm" className={`${getCategoryColor(event.category)} text-white mt-1`}>
                          {event.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No upcoming events
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Event Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries({
                    Academic: "bg-blue-500",
                    Events: "bg-green-500",
                    Examinations: "bg-red-500",
                    Sports: "bg-orange-500",
                    Cultural: "bg-pink-500",
                    General: "bg-gray-500",
                  }).map(([category, color]) => (
                    <div key={category} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${color}`}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Detail Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getCategoryColor(selectedEvent.category)} text-white`}>
                    {selectedEvent.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(selectedEvent.eventDate), "PPPP")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(selectedEvent.eventDate), "p")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedEvent.content}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
