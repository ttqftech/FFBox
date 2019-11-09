Attribute VB_Name = "Module1"
Private Declare Function OpenProcess Lib "kernel32" (ByVal dwDesiredAccess As Long, ByVal bInheritHandle As Long, ByVal dwProcessId As Long) As Long
Private Declare Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long
Private Const SYNCHRONIZE = &H100000
Private Const STANDARD_RIGHTS_REQUIRED = &HF0000
Private Const PROCESS_ALL_ACCESS = (STANDARD_RIGHTS_REQUIRED Or SYNCHRONIZE Or &HFFF)
Private Const PROCESS_SUSPEND_RESUME = 2048
Private Declare Function NtSuspendProcess Lib "ntdll.dll" (ByVal hProc As Long) As Long
Private Declare Function NtResumeProcess Lib "ntdll.dll" (ByVal hProc As Long) As Long

Sub Main()
    If Command() <> "" And InStr(1, Command(), " ") <> 0 Then
        Dim Commands
        Commands = Split(Command(), " ")
        Dim hProcess As Long
        hProcess = OpenProcess(PROCESS_SUSPEND_RESUME, False, CLng(Commands(1)))
        If hProcess <> 0 Then
            Select Case (Commands(0))
            Case "0"
                NtSuspendProcess hProcess
            Case "1"
                NtResumeProcess hProcess
            End Select
        End If
        CloseHandle hProcess
    End If
End Sub
