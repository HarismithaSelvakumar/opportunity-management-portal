import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

export default function Calendar() {
  const [opps, setOpps] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [oppRes, appRes] = await Promise.all([
          API.get("/opportunities"),
          API.get("/applications/me"),
        ]);

        setOpps(Array.isArray(oppRes.data) ? oppRes.data : []);
        setApps(Array.isArray(appRes.data) ? appRes.data : []);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const toDateOnly = (dt) => {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const oppEvents = useMemo(() => {
    return opps
      .filter((o) => o?.deadline)
      .map((o) => {
        const d = toDateOnly(o.deadline);
        if (!d) return null;
        return {
          key: `opp-${o._id}`,
          title: o.title || "-",
          company: o.company || "-",
          type: o.type || "-",
          source: "Opportunity",
          date: d,
        };
      })
      .filter(Boolean);
  }, [opps]);

  const appEvents = useMemo(() => {
    return apps
      .map((a) => {
        if (!a.opportunityId) {
          const d = a.externalDeadline ? toDateOnly(a.externalDeadline) : null;
          return {
            key: `app-ext-${a._id}`,
            title: a.externalTitle || "-",
            company: a.externalCompany || "-",
            type: a.externalType || "-",
            source: "External Application",
            date: d,
          };
        }

        const opp = a.opportunityId;
        const d = opp?.deadline ? toDateOnly(opp.deadline) : null;
        return {
          key: `app-portal-${a._id}`,
          title: opp?.title || "-",
          company: opp?.company || "-",
          type: opp?.type || "-",
          source: "Portal Application",
          date: d,
        };
      })
      .filter((x) => x.date);
  }, [apps]);

  const allEvents = useMemo(() => [...oppEvents, ...appEvents], [oppEvents, appEvents]);

  const dayBuckets = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d, events: [] });
    }

    for (const e of allEvents) {
      const ms = 24 * 60 * 60 * 1000;
      const idx = Math.round((e.date.getTime() - todayStart.getTime()) / ms);
      if (idx >= 0 && idx < 14) days[idx].events.push(e);
    }

    for (const day of days) {
      day.events.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return days;
  }, [allEvents, todayStart]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-gray-700">
        Loading calendar...
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">
          {err}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Tip: Ensure backend is running and you are logged in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Calendar</h1>
        <p className="text-[32px] text-gray-600 mt-2">
          Upcoming deadlines for the next 14 days.
        </p>
      </div>

      <div className="space-y-4">
        {dayBuckets.map((day) => (
          <div
            key={day.date.toISOString()}
            className="w-full rounded-2xl border border-gray-200 bg-white px-7 py-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="w-20 shrink-0 text-left leading-none">
                <div className="text-lg uppercase text-gray-600 tracking-wide">
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-5xl font-bold text-gray-900 mt-1">
                  {String(day.date.getDate()).padStart(2, "0")}
                </div>
                <div className="text-2xl text-gray-600 mt-1">
                  {day.date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>

              <div className="min-w-0 flex-1 pt-1">
                {day.events.length === 0 ? (
                  <p className="text-4xl text-gray-400">No deadlines</p>
                ) : (
                  <div className="space-y-3">
                    {day.events.map((event) => (
                      <div key={event.key} className="text-gray-700">
                        <p className="text-xl font-semibold text-gray-900">
                          {event.title}
                          <span className="font-normal text-gray-500">
                            {" "}
                            - {event.company}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.type} - {event.source}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
