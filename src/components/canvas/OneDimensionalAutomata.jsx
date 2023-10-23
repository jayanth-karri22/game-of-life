import React, { useEffect, useState } from 'react'
import { MeshStandardMaterial, BoxGeometry } from 'three'
import { useFrame } from '@react-three/fiber'
import { Leva, button, useControls } from 'leva'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

const Cube = ({ position, isAlive, hideDeadCells }) => {
  if (hideDeadCells && !isAlive) return null
  const isCenterCube = position[0] === 0 && position[1] === 0 && position[2] === 0
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      {isAlive ? <meshBasicMaterial color={'white'} toneMapped={false} /> : <meshBasicMaterial color={'black'} />}
    </mesh>
  )
}

export const OneDimensionalAutomata = () => {
  const [gridSize, setGridSize] = useState(5)
  const [hideDeadCells, setHideDeadCells] = useState(false)
  const [speed, setSpeed] = useState(0.1)
  const { dimension, initialCells, randomize } = useControls({
    dimension: {
      options: ['1D', '1DStacked', '2D', '3D'],
      value: '1DStacked',
    },
    initialCells: {
      value: '0'.repeat(gridSize) + '1' + '0'.repeat(gridSize),
      label: 'Initial Cells (0 or 1)',
    },
    size: {
      value: gridSize,
      min: 1,
      max: 15,
      step: 1,
      onChange: (value) => {
        setGridSize(value)
      },
    },
    toggleDeadCells: {
      value: hideDeadCells,
      label: 'Hide Dead Cells',
      onChange: (value) => {
        setHideDeadCells(value)
      },
    },
    changeSlowness: {
      value: speed,
      min: 0,
      max: 1,
      step: 0.1,
      onChange: (value) => {
        setSpeed(value)
      },
    },
  })

  const [grid, setGrid] = useState([])

  useEffect(() => {
    if (dimension === '2D' || dimension === '3D') {
      generateRandomGrid(gridSize, dimension)
    }
  }, [dimension, gridSize])

  const generateRandomGrid = (size, dimension) => {
    let newGrid = []
    if (dimension === '2D') {
      newGrid = Array.from({ length: size }, () => Array.from({ length: size }, () => (Math.random() > 0.5 ? 1 : 0)))
    } else if (dimension === '3D') {
      newGrid = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Array.from({ length: size }, () => (Math.random() > 0.5 ? 1 : 0))),
      )
    }
    setGrid(newGrid)
  }
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

  useFrame(
    (state, delta) => {
      const currentTime = state.clock.getElapsedTime()
      const deltaTime = currentTime - lastUpdateTime

      if (deltaTime >= speed && generations.length > 0) {
        const lastGen = generations[generations.length - 1]
        const nextGen = new Array(lastGen.length).fill(0)

        for (let i = 1; i < lastGen.length - 1; i++) {
          const left = lastGen[i - 1]
          const me = lastGen[i]
          const right = lastGen[i + 1]
          nextGen[i] = rules(left, me, right)
        }

        if (dimension === '1DStacked') {
          setGenerations((prev) => [...prev, nextGen])
        } else {
          setGenerations([nextGen])
        }

        setLastUpdateTime(currentTime)
        updateGrid()
      }
    },
    [speed],
  )

  const blackMaterial = new MeshStandardMaterial({ color: 'black' })
  const whiteMaterial = new MeshStandardMaterial({ color: 'white' })
  const sharedGeometry = new BoxGeometry(1, 1, 1)

  const offset = 1

  const getNeighbors = (x, y, z) => {
    const neighbors = []
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue
          neighbors.push([x + dx, y + dy, z + dz])
        }
      }
    }
    return neighbors
  }

  const updateGrid = () => {
    setGrid((prevGrid) => {
      const newGrid = JSON.parse(JSON.stringify(prevGrid))
      if (dimension === '2D') {
        for (let x = 0; x < newGrid.length; x++) {
          for (let y = 0; y < newGrid[x].length; y++) {
            const neighbors = [
              [x - 1, y - 1],
              [x, y - 1],
              [x + 1, y - 1],
              [x - 1, y],
              [x + 1, y],
              [x - 1, y + 1],
              [x, y + 1],
              [x + 1, y + 1],
            ]

            let aliveNeighbors = 0

            for (const [nx, ny] of neighbors) {
              if (newGrid[nx] && typeof newGrid[nx][ny] !== 'undefined') {
                aliveNeighbors += newGrid[nx][ny]
              }
            }

            if (newGrid[x][y] === 1) {
              newGrid[x][y] = aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0
            } else {
              newGrid[x][y] = aliveNeighbors === 3 ? 1 : 0
            }
          }
        }
      } else if (dimension === '3D') {
        for (let x = 0; x < newGrid.length; x++) {
          for (let y = 0; y < newGrid[x].length; y++) {
            for (let z = 0; z < newGrid[x][y].length; z++) {
              const neighbors = getNeighbors(x, y, z)
              let aliveNeighbors = 0

              for (const [nx, ny, nz] of neighbors) {
                if (newGrid[nx]?.[ny]?.[nz] !== undefined) {
                  aliveNeighbors += newGrid[nx][ny][nz]
                }
              }

              newGrid[x][y][z] =
                newGrid[x][y][z] === 1
                  ? aliveNeighbors === 2 || aliveNeighbors === 3
                    ? 1
                    : 0
                  : aliveNeighbors === 3
                  ? 1
                  : 0
            }
          }
        }
      }
      return newGrid
    })
  }

  return (
    <group>
      <EffectComposer>
        <Bloom mipmapBlur />
      </EffectComposer>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {dimension === '1D'
        ? generations[0]?.map((cell, i) => (
            <mesh
              key={i}
              position={[i - generations[0].length / 2, 0, 0]}
              geometry={sharedGeometry}
              material={cell === 1 ? blackMaterial : whiteMaterial}
            />
          ))
        : dimension === '1DStacked'
        ? generations.map((generation, y) =>
            generation.map((cell, x) => (
              <mesh
                key={`${y}-${x}`}
                position={[x - generation.length / 2, y, 0]}
                geometry={sharedGeometry}
                material={cell === 1 ? blackMaterial : whiteMaterial}
              />
            )),
          )
        : dimension === '2D'
        ? grid.map((row, x) =>
            row.map((cell, y) => (
              <Cube
                key={`${x}-${y}`}
                position={[x * 2 - grid.length + 0.5, y * 2 - row.length + 0.5, 0]}
                isAlive={cell === 1}
                hideDeadCells={hideDeadCells}
              />
            )),
          )
        : Array.isArray(grid) &&
          grid.map(
            (plane, x) =>
              Array.isArray(plane) &&
              plane.map(
                (row, y) =>
                  Array.isArray(row) &&
                  row.map((cell, z) => (
                    <Cube
                      key={`${x}-${y}-${z}`}
                      position={[x * 2 - grid.length + 1, y * 2 - plane.length + 1, z * 2 - row.length + 1]}
                      isAlive={cell === 1}
                      hideDeadCells={hideDeadCells}
                    />
                  )),
              ),
          )}
    </group>
  )
}
