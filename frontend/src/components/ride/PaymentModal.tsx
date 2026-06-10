import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle, CreditCard, QrCode, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import type { Payment, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/Button';

interface PaymentModalProps {
  payment: Payment;
  driverName: string;
  driverUpiId: string | null;
  onClose: (paid: boolean) => void;
}

type Tab = 'upi' | 'qr' | 'cash';

export function PaymentModal({ payment, driverName, driverUpiId, onClose }: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>('upi');
  const [upiInput, setUpiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const upiLink = driverUpiId
    ? `upi://pay?pa=${encodeURIComponent(driverUpiId)}&pn=${encodeURIComponent(driverName)}&am=${payment.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('CampusRide Payment')}`
    : null;

  useEffect(() => {
    if (tab === 'qr' && qrCanvasRef.current && upiLink) {
      QRCode.toCanvas(qrCanvasRef.current, upiLink, {
        width: 220,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [tab, upiLink]);

  const handlePay = async (method: PaymentMethod) => {
    setLoading(true);
    try {
      const txnId =
        method === 'CASH'
          ? undefined
          : method === 'UPI'
          ? upiInput || undefined
          : `QR-${Date.now()}`;

      await api.completePayment(payment.id, method, txnId);
      setPaid(true);
      addToast('success', `₹${payment.amount} payment recorded`);
    } catch {
      addToast('error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="glass w-full max-w-sm rounded-3xl border border-glass-border p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-2xl text-on-surface">Payment Done!</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            ₹{payment.amount} paid to {driverName}
          </p>
          <Button className="mt-6 w-full" onClick={() => onClose(true)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof CreditCard }[] = [
    { id: 'upi', label: 'UPI', icon: CreditCard },
    { id: 'qr', label: 'QR Code', icon: QrCode },
    { id: 'cash', label: 'Cash', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass w-full max-w-sm rounded-3xl border border-glass-border">
        <div className="border-b border-glass-border px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Ride complete
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl text-on-surface">₹{payment.amount}</span>
            <span className="text-sm text-on-surface-variant">to {driverName}</span>
          </div>
        </div>

        <div className="flex gap-1 border-b border-glass-border px-4 pt-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
                tab === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container/50',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {tab === 'upi' && (
            <div className="space-y-4">
              {driverUpiId ? (
                <div className="rounded-2xl bg-surface-container/40 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    Driver UPI ID
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-on-surface">
                    {driverUpiId}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">
                  Driver hasn't set a UPI ID. Use QR or cash.
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Your UPI Transaction ID (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012"
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value)}
                  className="w-full rounded-xl border border-glass-border bg-surface-container/30 px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handlePay('UPI')}
                loading={loading}
                disabled={!driverUpiId}
              >
                Mark as Paid via UPI
              </Button>
            </div>
          )}

          {tab === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              {upiLink ? (
                <>
                  <div className="rounded-2xl bg-white p-3">
                    <canvas ref={qrCanvasRef} />
                  </div>
                  <p className="text-center text-xs text-on-surface-variant">
                    Scan with any UPI app (GPay, PhonePe, Paytm)
                  </p>
                  <Button className="w-full" onClick={() => handlePay('QR_CODE')} loading={loading}>
                    Mark as Paid via QR
                  </Button>
                </>
              ) : (
                <p className="py-4 text-center text-sm text-on-surface-variant">
                  Driver hasn't set a UPI ID — QR unavailable.
                  <br />
                  Use cash instead.
                </p>
              )}
            </div>
          )}

          {tab === 'cash' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface-container/40 px-4 py-4 text-center">
                <p className="text-xs text-on-surface-variant">Hand over cash to driver</p>
                <p className="mt-1 font-display text-3xl text-on-surface">₹{payment.amount}</p>
              </div>
              <Button className="w-full" onClick={() => handlePay('CASH')} loading={loading}>
                Paid in Cash
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-glass-border px-6 pb-5">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="w-full py-2 text-xs text-on-surface-variant hover:text-on-surface"
          >
            Skip payment
          </button>
        </div>
      </div>
    </div>
  );
}
