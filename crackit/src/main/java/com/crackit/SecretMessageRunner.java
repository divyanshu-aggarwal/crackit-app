package com.crackit;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.Arrays;

public class SecretMessageRunner {

    static class Cell {
        int x, y;
        char c;

        Cell(int x, int y, char c) {
            this.x = x;
            this.y = y;
            this.c = c;
        }
    }

    public static void printSecretMessage(String url) throws Exception {
        Document doc = Jsoup.connect(url).get();
        Elements rows = doc.select("table tr");

        java.util.List<Cell> cells = new java.util.ArrayList<>();

        int maxX = 0;
        int maxY = 0;

        for (int i = 1; i < rows.size(); i++) {
            Elements cols = rows.get(i).select("td");

            if (cols.size() != 3) {
                continue;
            }

            int x = Integer.parseInt(cols.get(0).text().trim());
            char c = cols.get(1).text().charAt(0);
            int y = Integer.parseInt(cols.get(2).text().trim());

            cells.add(new Cell(x, y, c));

            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }

        char[][] grid = new char[maxY + 1][maxX + 1];

        for (char[] row : grid) {
            Arrays.fill(row, ' ');
        }

        for (Cell cell : cells) {
            grid[cell.y][cell.x] = cell.c;
        }

        for (char[] row : grid) {
            System.out.println(new String(row));
        }
    }

    public static void main(String[] args) throws Exception {
        printSecretMessage("https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub");
    }
}