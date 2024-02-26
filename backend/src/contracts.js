import { ethers } from 'ethers'

export default () => {
	const provider = new ethers.WebSocketProvider('wss://ethereum-sepolia.publicnode.com', 11155111)

	return {
		base: new ethers.Contract(
			'0x2B6d1e40db1BCBbfb06d3CA6B75B12aCA94833F1',
			['function ownerOf(uint256) external view returns (address)'],
			provider,
		),
		addons: new ethers.Contract(
			'0x02ec004DaB8d5719BC42D7d011ff0f282D1b610F',
			['function balanceOfBatch(address[], uint256[]) external view returns (uint256[])'],
			provider,
		),
	}
}
