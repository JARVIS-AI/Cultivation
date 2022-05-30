import React from 'react'
import { listen } from '@tauri-apps/api/event'
import './App.css'

import DownloadHandler from '../utils/download'

// Major Components
import TopBar from './components/TopBar'
import ServerLaunchSection from './components/ServerLaunchSection'
import MainProgressBar from './components/common/MainProgressBar'
import Options from './components/menu/Options'
import MiniDialog from './components/MiniDialog'
import DownloadList from './components/common/DownloadList'
import Downloads from './components/menu/Downloads'
import NewsSection from './components/news/NewsSection'
import Game from './components/menu/Game'

import RightBar from './components/RightBar'
import { getConfigOption, setConfigOption } from '../utils/configuration'
import { invoke } from '@tauri-apps/api'
import { dataDir } from '@tauri-apps/api/path'
import { appWindow } from '@tauri-apps/api/window'

interface IProps {
  [key: string]: never;
}

interface IState {
  isDownloading: boolean;
  optionsOpen: boolean;
  miniDownloadsOpen: boolean;
  downloadsOpen: boolean;
  gameDownloadsOpen: boolean;
  bgFile: string;
}

const downloadHandler = new DownloadHandler()

class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props)
    this.state = {
      isDownloading: false,
      optionsOpen: false,
      miniDownloadsOpen: false,
      downloadsOpen: false,
      gameDownloadsOpen: false,
      bgFile: 'https://webstatic.hoyoverse.com/upload/event/2020/11/04/7fd661b5184e1734f91f628b6f89a31f_7367318474207189623.png',
    }

    listen('lang_error', (payload) => {
      console.log(payload)
    })

    listen('jar_extracted', ({ payload }) => {
      setConfigOption('grasscutter_path', payload)
    })

    let min = false

    // periodically check if we need to min/max based on whether the game is open
    setInterval(async () => {
      const gameOpen = await invoke('is_game_running')

      if (gameOpen && !min) {
        appWindow.minimize()
        min = true
      } else if (!gameOpen && min) {
        appWindow.unminimize()
        min = false
      }
    }, 1000)
  }

  async componentDidMount() {
    const cert_generated = await getConfigOption('cert_generated')
    const game_exe = await getConfigOption('game_install_path')
    const game_path = game_exe.substring(0, game_exe.lastIndexOf('\\'))
    const root_path = game_path.substring(0, game_path.lastIndexOf('\\'))

    if (game_path) {
      // Get the bg by invoking, then set the background to that bg
      const bgLoc: string = await invoke('get_bg_file', {
        bgPath: root_path,
      })

      if (bgLoc) {
        this.setState({
          bgFile: bgLoc
        })
      }
    }

    if (!cert_generated) {
      // Generate the certificate
      await invoke('generate_ca_files', {
        path: await dataDir() + 'cultivation'
      })

      await setConfigOption('cert_generated', true)
    }

    // Period check to only show progress bar when downloading files
    setInterval(() => {
      this.setState({
        isDownloading: downloadHandler.getDownloads().filter(d => d.status !== 'finished')?.length > 0
      })
    }, 1000)
  }

  render() {
    return (
      <div className="App" style={
        this.state.bgFile ? {
          background: `url(${this.state.bgFile}) no-repeat center center fixed`,
        } : {}
      }>
        <TopBar
          optFunc={() => {
            this.setState({ optionsOpen: !this.state.optionsOpen })
          }}
          downFunc={() => this.setState({ downloadsOpen: !this.state.downloadsOpen })}
          gameFunc={() => this.setState({ gameDownloadsOpen: !this.state.gameDownloadsOpen })}
        />

        <RightBar />

        <NewsSection />

        {
          // Mini downloads section
          this.state.miniDownloadsOpen ? (
            <div className="MiniDownloads">
              <MiniDialog
                title="Downloads"
                closeFn={() => {
                  this.setState({ miniDownloadsOpen: false })
                }}
              >
                <DownloadList downloadManager={downloadHandler} />
              </MiniDialog>
              <div className="arrow-down"></div>
            </div>
          ) : null
        }

        {
          // Download menu
          this.state.downloadsOpen ? (
            <Downloads
              downloadManager={downloadHandler}
              closeFn={() => this.setState({ downloadsOpen: false })}
            />
          ) : null
        }

        {
          // Options menu
          this.state.optionsOpen ? (
            <Options
              closeFn={() => this.setState({ optionsOpen: !this.state.optionsOpen })}
            />
          ) : null
        }

        {
          // Game downloads menu
          this.state.gameDownloadsOpen ? (
            <Game
              downloadManager={downloadHandler}
              closeFn={() => this.setState({ gameDownloadsOpen: false })}
            />
          ) : null
        }

        <div className="BottomSection">
          <ServerLaunchSection />

          <div id="DownloadProgress"
            onClick={() => this.setState({ miniDownloadsOpen: !this.state.miniDownloadsOpen })}
          >
            { this.state.isDownloading ?
              <MainProgressBar downloadManager={downloadHandler} />
              : null }
          </div>
        </div>
      </div>
    )
  }
}

export default App
