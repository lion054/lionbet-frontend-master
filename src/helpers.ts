import { ethers } from 'ethers';
import { DateTime } from 'luxon';

export const provider = new ethers.providers.Web3Provider(window.ethereum);
// export const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_JSON_RPC_URL);

export async function requestAccount() {
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('ethereum', window.ethereum);
  } catch (err) {
    console.log('error', err);
    alert('Login to Metamask first');
  }
}

export enum SportKind {
  Soccer,
  Rugby,
  Basketball
}

export interface SportEvent {
  id: string;
  name: string;
  participants: string;
  participantCount: number;
  date: ethers.BigNumber;
  kind: SportKind;
}

export function getSportImageUrl(kind: SportKind) {
  switch (kind) {
    case SportKind.Soccer:
      return '/images/soccer.svg';
    case SportKind.Rugby:
      return '/images/rugby.svg';
    case SportKind.Basketball:
      return '/images/basketball.svg';
    default:
      return '';
  }
}

export function getSportType(kind: SportKind) {
  switch (kind) {
    case SportKind.Soccer:
      return 'Soccer';
    case SportKind.Rugby:
      return 'Rugby';
    case SportKind.Basketball:
      return 'Basketball';
    default:
      return '';
  }
}

export function timeToBigNumber(dt: DateTime) {
  const seconds = Math.ceil(dt.toSeconds()).toString();
  return ethers.utils.parseUnits(seconds, 'wei');
}

export function bigNumberToTime(value: ethers.BigNumber) {
  return DateTime.fromSeconds(value.toNumber());
}
