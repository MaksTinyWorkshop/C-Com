export type IconProps = {
    type: 'alert'
        | 'check'
        | 'chevron-down'
        | 'chevron-left'
        | 'chevron-right'
        | 'chevron-up'
        | 'circle-check'
        | 'circle-close'
        | 'close'
        | 'components'
        | 'copy'
        | 'discord'
        | 'facebook'
        | 'file'
        | 'github'
        | 'instagram'
        | 'linkedin'
        | 'mail'
        | 'phone'
        | 'home'
        | 'info'
        | 'moon'
        | 'order'
        | 'search'
        | 'sun'
        | 'warning'
        | string
    size?: number
    color?: string
    theme?: 'info' | 'success' | 'warning' | 'alert'
    iconSet?: {
        [key: string]: string
    }
}
