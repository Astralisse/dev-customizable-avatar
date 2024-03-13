export const base = {
  address: '0x2B6d1e40db1BCBbfb06d3CA6B75B12aCA94833F1',
  abi: [
    'function tokenOfOwnerByIndex(address, uint256) external view returns (uint256)',
    'function mint() public',
  ],
}

export const addons = {
  address: '0x02ec004DaB8d5719BC42D7d011ff0f282D1b610F',
  abi: [
    'function balanceOfBatch(address[], uint256[]) external view returns (uint256[])',
    'function mint(uint256[], uint256[]) public',
  ],
}
