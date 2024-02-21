import { ethers } from 'ethers'

export default () => {
	const provider = new ethers.WebSocketProvider('wss://ethereum-sepolia.publicnode.com', 11155111)

	return {
		base: new ethers.Contract(
			'0xECEd1b3641e9E4649c4950C8518731616157DA17',
			['function ownerOf(uint256) external view returns (address)'],
			provider,
		),
		addons: new ethers.Contract(
			'0xf60870063925ED456e053696D5c3A60adA990C6D',
			['function balanceOfBatch(address[], uint256[]) external view returns (uint256[])'],
			provider,
		),
	}
}
