import typer
from rich import print
from rich.panel import Panel
from rich.align import Align
from rich.console import Console
from rich.text import Text
from rich.live import Live
from rich.style import Style
from time import sleep

app = typer.Typer()


def create_content():
    content = Text()
    content.append(" \n minorun365 (みのるん)\n\n", style="bold cyan")
    content.append("  Role:     ", style="green")
    content.append("Technology Evangelist at KAG\n", style="yellow")
    content.append("  Certs:    ", style="green")
    content.append("AWS Community Hero, AWS Samurai\n\n", style="yellow")

    content.append("  X:        ", style="green")
    content.append("https://twitter.com/minorun365\n", style="blue underline")
    content.append("  Slides:   ", style="green")
    content.append("https://speakerdeck.com/minorun365\n", style="blue underline")
    content.append("  Blog:     ", style="green")
    content.append("https://qiita.com/minorun365\n", style="blue underline")
    content.append("  LinkedIn: ", style="green")
    content.append("https://linkedin.com/in/minorun365\n", style="blue underline")
    content.append("  GitHub:   ", style="green")
    content.append("https://github.com/minorun365\n\n", style="blue underline")

    content.append("  Book1:    ", style="green")
    content.append("https://amazon.co.jp/dp/4815626448\n", style="blue underline")
    content.append("  Book2:    ", style="green")
    content.append("https://amazon.co.jp/dp/4798075736\n", style="blue underline")
    return content


@app.command()
def main():
    full_content = create_content()
    lines = full_content.split("\n")

    console = Console()

    with Live(console=console, refresh_per_second=20) as live:
        content = Text()
        for line in lines:
            for char in line:
                content.append(char)
                panel = Panel(
                    Align.center(content, vertical="middle"),
                    #border_style="white",
                    expand=False,
                )
                live.update(panel)
                sleep(0.02)  # タイピング速度の調整
            content.append("\n")
            live.update(panel)
            sleep(0.1)  # 行の間の短い停止

        for i in range(1, 50):
            panel.border_style = Style(color=f"color({i*5})")
            live.update(panel)
            sleep(0.1)


if __name__ == "__main__":
    app()
