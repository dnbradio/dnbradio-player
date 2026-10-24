const MPEG1_BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  3: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
};
const MPEG2_BITRATES = {
  1: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  3: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
};
const MPEG_SAMPLE_RATES = {
  0: [11025, 12000, 8000],
  2: [22050, 24000, 16000],
  3: [44100, 48000, 32000],
};
const ADTS_SAMPLE_RATES = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
  8000, 7350,
];
const READ_LIMIT = 64 * 1024;
const ID3_LIMIT = 4 * 1024 * 1024;

// Layer bits: 1 = Layer III, 2 = Layer II, 3 = Layer I.
function mpegFrame(bytes, i) {
  if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) {
    return null;
  }
  const version = (bytes[i + 1] >> 3) & 3;
  const layer = (bytes[i + 1] >> 1) & 3;
  const bitrateIndex = bytes[i + 2] >> 4;
  const sampleRateIndex = (bytes[i + 2] >> 2) & 3;
  if (
    version === 1 ||
    layer === 0 ||
    bitrateIndex === 0 ||
    bitrateIndex === 15 ||
    sampleRateIndex === 3
  ) {
    return null;
  }
  const mpeg1 = version === 3;
  const kbps = (mpeg1 ? MPEG1_BITRATES : MPEG2_BITRATES)[layer][bitrateIndex];
  const sampleRate = MPEG_SAMPLE_RATES[version][sampleRateIndex];
  const padding = (bytes[i + 2] >> 1) & 1;
  const length =
    layer === 3
      ? (Math.floor((12 * kbps * 1000) / sampleRate) + padding) * 4
      : Math.floor(
          (((layer === 1 && !mpeg1 ? 576 : 1152) / 8) * kbps * 1000) /
            sampleRate
        ) + padding;
  return {
    kbps,
    sampleRate,
    channels: bytes[i + 3] >> 6 === 3 ? 1 : 2,
    length,
  };
}

function adtsFrame(bytes, i) {
  if (bytes[i] !== 0xff || (bytes[i + 1] & 0xf6) !== 0xf0) {
    return null;
  }
  const sampleRate = ADTS_SAMPLE_RATES[(bytes[i + 2] >> 2) & 0xf];
  const channels = ((bytes[i + 2] & 1) << 2) | (bytes[i + 3] >> 6);
  const length =
    ((bytes[i + 3] & 3) << 11) | (bytes[i + 4] << 3) | (bytes[i + 5] >> 5);
  if (!sampleRate || length < 7) {
    return null;
  }
  return { sampleRate, channels, length };
}

function id3Length(bytes) {
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return 0;
  }
  const size = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
  return 10 + size + (bytes[5] & 0x10 ? 10 : 0);
}

// A sync word only counts when the next frame starts where this one ends.
export function parseAudioInfo(bytes) {
  for (let i = id3Length(bytes); i < bytes.length - 8; i++) {
    const mpeg = mpegFrame(bytes, i);
    if (mpeg) {
      const next = mpegFrame(bytes, i + mpeg.length);
      if (next && next.sampleRate === mpeg.sampleRate) {
        return {
          kbps: mpeg.kbps,
          sampleRate: mpeg.sampleRate,
          channels: mpeg.channels,
        };
      }
    }
    const adts = adtsFrame(bytes, i);
    if (adts && adtsFrame(bytes, i + adts.length)) {
      let total = 0;
      let frames = 0;
      for (let at = i, frame = adts; frame && frames < 50; frames++) {
        total += frame.length;
        at += frame.length;
        frame = adtsFrame(bytes, at);
      }
      return {
        kbps: Math.round(
          (total * 8 * adts.sampleRate) / (1024 * frames) / 1000
        ),
        sampleRate: adts.sampleRate,
        channels: adts.channels,
      };
    }
  }
  return null;
}

export async function readAudioInfo(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok || !response.body) {
      return null;
    }
    const reader = response.body.getReader();
    let bytes = new Uint8Array(0);
    let limit = READ_LIMIT;
    while (bytes.length < limit) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const joined = new Uint8Array(bytes.length + value.length);
      joined.set(bytes);
      joined.set(value, bytes.length);
      bytes = joined;
      if (bytes.length >= 10 && limit === READ_LIMIT) {
        limit = Math.min(id3Length(bytes) + READ_LIMIT, ID3_LIMIT);
      }
    }
    return parseAudioInfo(bytes);
  } catch (err) {
    console.log("cannot read audio info", url, err.message);
    return null;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
