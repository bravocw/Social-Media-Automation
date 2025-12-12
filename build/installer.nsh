!macro customInstall
!macroend

!macro customUnInstall
!macroend

!macro customOnInstSuccess
  nsDialogs::Create 1018
  Pop $Dialog

  ; Logo
  nsDialogs::CreateCtl "STATIC" "SS_BITMAP" 20u 20u 32u 32u ""
  Pop $LogoHandle
  SendMessage $LogoHandle ${STM_SETIMAGE} ${IMAGE_BITMAP} \
    $(nsDialogs::LoadImage "build/logo.png")

  ; Text branding
  nsDialogs::CreateCtl "STATIC" "SS_LEFT" 60u 28u 200u 20u "Developed by PT Devel © 2025"
  Pop $TextHandle

  nsDialogs::Show
!macroend
