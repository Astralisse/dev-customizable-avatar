'use client'

import { useState, useEffect } from 'react'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { BrowserProvider, Contract } from 'ethers'
import * as contracts from './contracts'
import Box from './components/Box'
import Button from './components/Button'
import Checkbox from './components/Checkbox'

const findBaseId = async (baseContract, address) => {
  try {
    return await baseContract.tokenOfOwnerByIndex(address, 0)
  } catch {}
  return null
}

const ADDONS_COUNT = 7
const ADDONS = [["Glasses", [0, 1, 2, 3]], ["Hats", [4, 5, 6]]]

export default function Home() {
  const { address, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const [loading, setLoading] = useState(false)
  const [baseId, setBaseId] = useState(null)
  const [addonBalances, setAddonBalances] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [c, setC] = useState(null)

  const makeC = async () => {
    if (!isConnected) {
      setC(null)
      return
    }
    const ethersProvider = new BrowserProvider(walletProvider)
    const signer = await ethersProvider.getSigner()
    setC({
      base: new Contract(contracts.base.address, contracts.base.abi, signer),
      addons: new Contract(contracts.addons.address, contracts.addons.abi, signer),
    })
  }

  const updateTokens = async () => {
    if (c === null) {
      setBaseId(null)
      setAddonBalances(null)
      return
    }
    const newBaseId = await findBaseId(c.base, address)
    setBaseId(newBaseId)
    if (newBaseId !== null) {
      const balances = (await c.addons.balanceOfBatch(
        Array(ADDONS_COUNT).fill(address),
        [...Array(ADDONS_COUNT).keys()],
      )).map(value => parseInt(value))
      setAddonBalances(balances)
      const metadata = await (await fetch(`https://0.dev.astralisse.com/avatar/metadata/${newBaseId}`)).json()
      setEquipment(metadata.addons)
    } else {
      setAddonBalances(null)
      setEquipment([])
    }
  }

  const mint = async () => {
    setLoading(true)
    try {
      await c.base.mint()
      await updateTokens()
    } catch {}
    setLoading(false)
  }

  const mintAddon = async (id) => {
    setLoading(true)
    try {
      await c.addons.mint([id], [1])
      await updateTokens()
    } catch {}
    setLoading(false)
  }

  const forceUpdate = async () => {
    setLoading(true)
    await updateTokens()
    setLoading(false)
  }

  const changeEquipment = (e, id) => {
    if (e.target.checked) {
      setEquipment([...equipment, id])
    } else {
      setEquipment(equipment.filter(value => value !== id))
    }
  }

  const equip = async () => {
    setLoading(true)
    const url = `https://0.dev.astralisse.com/avatar/${baseId}`
    const metadata = await (await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipment),
    })).json()
    setEquipment(metadata.addons)
    setLoading(false)
  }

  useEffect(() => { makeC() }, [])
  useEffect(() => { makeC() }, [address, isConnected])
  useEffect(() => { updateTokens() }, [c])

  return (
    <main className="flex min-h-screen p-8 items-center justify-center bg-gray-950 text-white">
      <div className="flex flex-col gap-8">
        <div className="flex justify-center min-h-16">
          <w3m-button />
        </div>
        {isConnected && <div className="flex justify-center gap-8">
          <Box>
            <Button text="Update" onClick={forceUpdate} loading={loading} />
            {baseId === null && (
              <Button text="Mint base token" onClick={mint} loading={loading} />
            )}
            {baseId !== null && (
              <div>Your base token id: {baseId.toString()}</div>
            )}
            {!loading && addonBalances !== null && (
              <img className="h-32" src={`https://0.dev.astralisse.com/avatar/image/${baseId}?x=${Date.now()}`} />
            )}
          </Box>
          {baseId !== null && addonBalances !== null && (
            <Box>
              <Button text="Equip selected" onClick={equip} loading={loading} />
              {ADDONS.map(([name, ids]) => <div key={name}>
                <div>{name}:</div>
                {ids.map((id) => (
                  <div key={id} className="flex items-center gap-8">
                    <Checkbox checked={equipment.includes(id)} onChange={(e) => changeEquipment(e, id)} disabled={loading || addonBalances[id] === 0} />
                    <img className="h-16" src={`https://0.dev.astralisse.com/addon/image/${id}`} />
                    <Button text="Mint" onClick={async () => mintAddon(id)} loading={loading} />
                    <div>You own {addonBalances[id]}</div>
                  </div>
                ))}
              </div>)}
            </Box>
          )}
        </div>}
      </div>
    </main>
  )
}
