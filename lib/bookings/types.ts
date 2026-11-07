import type { NailConfig } from '@/components/NailControls';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

/** Het ontwerp uit de nagelconfigurator, zoals de designerpagina het bijhoudt. */
export type NailDesign = NailConfig;

export type Appointment = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  /** Optioneel ontwerp uit de configurator. */
  design: NailDesign | null;
  /** Kalenderdag als UTC-middernacht, zodat de datum niet verschuift met de servertijdzone. */
  date: Date;
  /** 'HH:MM' in de lokale salontijd (Europe/Brussels). */
  startTime: string;
  /** Duur in minuten. */
  duration: number;
  status: AppointmentStatus;
  verificationToken: string;
  expiresAt: Date;
  createdAt: Date;
};

/** 'YYYY-MM-DD' van de afspraakdag. */
export function appointmentDateKey(appointment: Pick<Appointment, 'date'>): string {
  return appointment.date.toISOString().slice(0, 10);
}