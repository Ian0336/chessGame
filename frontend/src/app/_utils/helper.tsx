export const RAW_LENGTH = 3;
export const BLOCK_LENGTH = 2;
export const OFFSET_X = -RAW_LENGTH * BLOCK_LENGTH / 3 ;
export const OFFSET_Y = -RAW_LENGTH * BLOCK_LENGTH / 3 ;
export const COLOR_OF_PLAYER = [0x333333, 0xffffff];
export type Player = {
  id: number;
  name: string;
  chessList: Array<[number, number]>;
}