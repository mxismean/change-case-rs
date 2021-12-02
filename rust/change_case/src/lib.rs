use wasm_bindgen::prelude::*;
use regex::{Regex, Captures};

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console, js_name = log)]
  fn log(a: u32, b: &str);
}

/// 小写
#[wasm_bindgen]
pub fn lower(s: &str) -> String {
  s.to_lowercase()
}

/// 大写
#[wasm_bindgen]
pub fn upper(s: &str) -> String {
  s.to_uppercase()
}

/// 首字母大写
#[wasm_bindgen]
pub fn title(s:&str) -> String {
  s[..1].to_uppercase() + &s[1..]
}

/// 烤串
#[wasm_bindgen]
pub fn kebab(s:&str) -> String {
  let reg_u_5f2d = Regex::new(r"[[:alnum:]]+(\u{5F}+|\u{2D}+)").unwrap();
  let reg_5f2d_u = Regex::new(r"(\u{5F}+|\u{2D}+)[[:alnum:]]+").unwrap();
  let reg_u = Regex::new(r"[[:upper:]]{1}").unwrap();
  let reg_5f = Regex::new(r"\u{5F}+").unwrap();
  let reg_2d_s = Regex::new(r"\u{2D}+").unwrap();
  let reg_2d = Regex::new(r"^\u{2D}+|\u{2D}+$").unwrap();

  let str0 = reg_u_5f2d.replace_all(s, |c: &Captures| {
    c[0].to_lowercase()
  });
  let str1 = reg_5f2d_u.replace_all(&str0, |c: &Captures| {
    c[0].to_lowercase()
  });
  let str2 = reg_u.replace_all(&str1, |c: &Captures| {
    "-".to_string() + &c[0].to_lowercase()
  });
  let str3 = reg_5f.replace_all(&str2, "-");
  let str4 = reg_2d_s.replace_all(&str3, "-");
  reg_2d.replace_all(&str4, "").to_string()
}

/// 蛇形
#[wasm_bindgen]
pub fn snake(s:&str) -> String {
  let reg_2d = Regex::new(r"\u{2D}").unwrap();
  let str1 = kebab(s);
  reg_2d.replace_all(&str1, "_").to_string()

}

/// 小驼峰
#[wasm_bindgen]
pub fn camel(s:&str) -> String {
  let reg_2d_l = Regex::new(r"\u{2D}+[[:alnum:]]{1}").unwrap();
  let str1 = kebab(s);
  let str2 = reg_2d_l.replace_all(&str1, |c: &Captures| {
    c[0].to_uppercase()
  });
  let reg_2d = Regex::new(r"\u{2D}+").unwrap();
  reg_2d.replace_all(&str2, "").to_string()
}

/// 常量
#[wasm_bindgen]
pub fn constant(s:&str) -> String {
  snake(s).to_uppercase()
}

