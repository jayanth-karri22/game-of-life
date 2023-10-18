import React, { useEffect, useState } from 'react'
import { MeshStandardMaterial, BoxGeometry } from 'three'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'

export const OneDimensionalAutomata = () => {
  const { dimension, initialCells } = useControls({
    dimension: {
      options: ['1D', '2D'],
      value: '2D',
    },
    initialCells: {
      value: '0'.repeat(10) + '1' + '0'.repeat(10),
      label: 'Initial Cells (0 or 1)',
    },
  })

  const [generations, setGenerations] = useState([])
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const ruleset = [0, 1, 0, 1, 1, 0, 1, 0]

  const rules = (a, b, c) => {
    const index = 4 * a + 2 * b + c
    return ruleset[index]
  }

  useEffect(() => {
    const parsedInitialCells = Array.from(initialCells).map(Number)
    setGenerations([parsedInitialCells])
  }, [initialCells])

  useFrame((state) => {
    const currentTime = state.clock.getElapsedTime()
    const deltaTime = currentTime - lastUpdateTime

    if (deltaTime >= 1 && generations.length > 0) {
      const lastGen = generations[generations.length - 1]
      const nextGen = new Array(lastGen.length).fill(0)

      for (let i = 1; i < lastGen.length - 1; i++) {
        const left = lastGen[i - 1]
        const me = lastGen[i]
        const right = lastGen[i + 1]
        nextGen[i] = rules(left, me, right)
      }

      if (dimension === '2D') {
        setGenerations((prev) => [...prev, nextGen])
      } else {
        setGenerations([nextGen])
      }

      setLastUpdateTime(currentTime)
    }
  })

  const blackMaterial = new MeshStandardMaterial({ color: 'black' })
  const whiteMaterial = new MeshStandardMaterial({ color: 'white' })
  const sharedGeometry = new BoxGeometry(1, 1, 1)

  return (
    <group>
      {dimension === '1D'
        ? generations[0]?.map((cell, i) => (
            <mesh
              key={i}
              position={[i - generations[0].length / 2, 0, 0]}
              geometry={sharedGeometry}
              material={cell === 1 ? blackMaterial : whiteMaterial}
            />
          ))
        : generations.map((generation, y) =>
            generation.map((cell, x) => (
              <mesh
                key={`${y}-${x}`}
                position={[x - generation.length / 2, y, 0]}
                geometry={sharedGeometry}
                material={cell === 1 ? blackMaterial : whiteMaterial}
              />
            )),
          )}
    </group>
  )
}
