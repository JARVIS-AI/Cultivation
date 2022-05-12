import React from 'react'

import Close from '../../resources/icons/close.svg'
import './MiniDialog.css'

interface IProps {
  children: React.ReactNode[] | React.ReactNode;
  closeFn: () => void;
}

export default class MiniDialog extends React.Component<IProps, never> {
  constructor(props: IProps) {
    super(props)
  }

  render() {
    return (
      <div className="MiniDialog">
        <div className="MiniDialogTop" onClick={this.props.closeFn}>
          <div></div>
          <img src={Close} className="MiniDialogClose" />
        </div>
        <div className="MiniDialogInner">
          {this.props.children}
        </div>
      </div>
    )
  }
}