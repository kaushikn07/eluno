"use client";

import { useState } from "react";
import { format, isPast } from "date-fns";
import StatusBadge from "./StatusBadge";
import OrderModal from "./OrderModal";

export default function OrdersTable({
  orders,
  onRefresh,
}: {
  orders: any[];
  onRefresh: () => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer & Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  QC
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {orders.map((order: any) => {
                const promised = order.promised_delivery_date
                  ? new Date(order.promised_delivery_date)
                  : null;
                const expected = order.expected_delivery_date
                  ? new Date(order.expected_delivery_date)
                  : null;
                const isDelayed = promised && expected && expected > promised;
                const isPastDue =
                  expected && isPast(expected) && order.status !== "delivered";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {order.order_number}
                        </span>
                        {order.is_reorder && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                            Reorder
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.store_location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expected ? (
                        <div
                          className={`font-medium ${isPastDue ? "text-red-600" : "text-slate-900"}`}
                        >
                          {format(expected, "MMM d, HH:mm")}
                          {isDelayed && (
                            <div className="text-xs text-amber-600 mt-0.5">
                              Delayed from {format(promised!, "MMM d")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">No Date</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.qc_fail_count > 0 ? (
                        <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                          {order.qc_fail_count} / {order.max_reorder_attempts}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
}
