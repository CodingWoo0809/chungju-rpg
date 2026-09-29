param([Parameter(Mandatory=$true)][string]$InputPath,[Parameter(Mandatory=$true)][string]$OutputPath)
Add-Type -AssemblyName System.Drawing
$source=[System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $InputPath));$width=$source.Width;$height=$source.Height
$mask=[byte[]]::new($width*$height);$visited=[bool[]]::new($mask.Length)
try{
 for($y=0;$y -lt $height;$y++){for($x=0;$x -lt $width;$x++){
  $pixel=$source.GetPixel($x,$y);$max=[Math]::Max($pixel.R,[Math]::Max($pixel.G,$pixel.B));$min=[Math]::Min($pixel.R,[Math]::Min($pixel.G,$pixel.B))
  $chroma=$max-$min;$luma=.2126*$pixel.R+.7152*$pixel.G+.0722*$pixel.B;$signal=[Math]::Max($chroma-7,198-$luma)
  $mask[$y*$width+$x]=[Math]::Max(0,[Math]::Min(255,[int](($signal+3)*20)))
 }}
 $queue=[System.Collections.Generic.Queue[int]]::new();$component=[System.Collections.Generic.List[int]]::new()
 for($seed=0;$seed -lt $mask.Length;$seed++){
  if($mask[$seed]-eq 0-or$visited[$seed]){continue};$queue.Enqueue($seed);$visited[$seed]=$true;$component.Clear()
  while($queue.Count-gt 0){$index=$queue.Dequeue();$component.Add($index);$x=$index%$width;$y=[int][Math]::Floor($index/$width)
   $neighbors=@();if($x-gt 0){$neighbors+=$index-1};if($x+1-lt$width){$neighbors+=$index+1};if($y-gt 0){$neighbors+=$index-$width};if($y+1-lt$height){$neighbors+=$index+$width}
   foreach($next in $neighbors){if($mask[$next]-gt 0-and-not$visited[$next]){$visited[$next]=$true;$queue.Enqueue($next)}}
  }
  if($component.Count-lt 420){foreach($index in $component){$mask[$index]=0}}
 }
 $output=New-Object System.Drawing.Bitmap $width,$height,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 try{for($y=0;$y-lt$height;$y++){for($x=0;$x-lt$width;$x++){$index=$y*$width+$x
  if($mask[$index]-eq 0){$output.SetPixel($x,$y,[System.Drawing.Color]::Transparent)}else{$pixel=$source.GetPixel($x,$y);$output.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($mask[$index],$pixel.R,$pixel.G,$pixel.B))}
 }};$output.Save($OutputPath,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$output.Dispose()}
}finally{$source.Dispose()}
