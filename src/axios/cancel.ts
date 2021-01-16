export class Cancel {
  public reason: string
  constructor(reason: string) {
    this.reason = reason
  }
}

export const isCancel = (reason: any) => {
  return reason instanceof Cancel
}

export class CancelToken {
  public resolve: any
  source() {
    return {
      token: new Promise((resolve) => {
        this.resolve = resolve
      }),
      cancel: (reason: string) => {
        this.resolve(new Cancel(reason))
      }
    }
  }
}