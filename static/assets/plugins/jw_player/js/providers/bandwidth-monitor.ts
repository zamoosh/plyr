import { BANDWIDTH_ESTIMATE } from 'events/events';
import { isValidNumber } from 'utils/underscore';
import type { ProviderWithMixins } from 'providers/default';

export type BandwidthMonitor = {
    start: () => void;
    stop: () => void;
    getEstimate: () => number;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export default function BandwidthMonitor(provider: ProviderWithMixins, initialEstimate: number): BandwidthMonitor {
    let bandwidthMonitorInterval: number | undefined;
    let bandwidthEstimate = initialEstimate;
    return {
        start(): void {
            this.stop();
            bandwidthMonitorInterval = window.setInterval(() => {
                const bwEstimate = provider.getBandwidthEstimate();
                if (!isValidNumber(bwEstimate)) {
                    return;
                }
                bandwidthEstimate = bwEstimate;
                provider.trigger(BANDWIDTH_ESTIMATE, {
                    bandwidthEstimate
                });
            }, 1000);
        },
        stop(): void {
            clearInterval(bandwidthMonitorInterval);
        },
        getEstimate(): number {
            return bandwidthEstimate;
        }
    };
}
