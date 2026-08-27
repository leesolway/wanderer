import { SignatureGroup, SystemSignature } from '@/hooks/Mapper/types';

export const isSignatureResolved = (sig: SystemSignature): boolean => {
  // A signature is "unknown" only while its group hasn't been identified yet
  // (still a raw Cosmic Signature). Once the group is known (Combat Site,
  // Wormhole, etc.), it counts as scanned even if the name/type/linked_system
  // isn't resolved yet.
  return !!sig.group && sig.group !== SignatureGroup.CosmicSignature;
};
